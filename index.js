require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

/* ================== EXPRESS (Mini App) ================== */
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log("🌐 Mini App running on port " + PORT);
});

/* ================== TELEGRAM BOT ================== */
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const MAIN_ADMIN = Number(process.env.ADMIN_ID);
const ADMINS = [MAIN_ADMIN];

const users = {};

/* ================== LANGUAGES ================== */
const LANG = {
  ru: {
    chooseLang: "🌐 Выберите язык",
    hello: "👋 Я бот-менеджер ресторана. Чем могу помочь?",
    book: "📅 Забронировать",
    about: "ℹ️ О ресторане",
    delivery: "🚚 Доставка",
    back: "⬅️ Назад",
    chooseFloor: "🏢 Выберите этаж",
    chooseTable: "🍽 Выберите стол",
    enterDate: "📅 Введите дату (например 12.06)",
    enterName: "👤 Введите ваше имя",
    enterPhone: "📞 Введите номер телефона",
    done: "✅ Бронь отправлена менеджеру. Мы скоро свяжемся с вами."
  },
  en: {
    chooseLang: "🌐 Choose language",
    hello: "👋 I am a restaurant manager bot. How can I help?",
    book: "📅 Reservation",
    about: "ℹ️ About",
    delivery: "🚚 Delivery",
    back: "⬅️ Back",
    chooseFloor: "🏢 Choose floor",
    chooseTable: "🍽 Choose table",
    enterDate: "📅 Enter date (e.g. 12.06)",
    enterName: "👤 Enter your name",
    enterPhone: "📞 Enter phone number",
    done: "✅ Reservation sent. We will contact you soon."
  },
  uz: {
    chooseLang: "🌐 Tilni tanlang",
    hello: "👋 Men restoran menejer botiman. Qanday yordam beray?",
    book: "📅 Band qilish",
    about: "ℹ️ Restoran haqida",
    delivery: "🚚 Yetkazib berish",
    back: "⬅️ Orqaga",
    chooseFloor: "🏢 Qavatni tanlang",
    chooseTable: "🍽 Stolni tanlang",
    enterDate: "📅 Sana kiriting (12.06)",
    enterName: "👤 Ismingizni kiriting",
    enterPhone: "📞 Telefon raqam",
    done: "✅ Buyurtma yuborildi. Tez orada bog‘lanamiz."
  }
};

/* ================== MENUS ================== */
function langMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
        [{ text: "🇬🇧 English", callback_data: "lang_en" }],
        [{ text: "🇺🇿 O‘zbek", callback_data: "lang_uz" }]
      ]
    }
  };
}

function mainMenu(lang) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: LANG[lang].book, callback_data: "book" }],
        [{ text: LANG[lang].about, callback_data: "about" }],
        [{ text: LANG[lang].delivery, web_app: { url: process.env.MINIAPP_URL || "" } }]
      ]
    }
  };
}

/* ================== START ================== */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, LANG.ru.chooseLang, langMenu());
});

/* ================== CALLBACKS ================== */
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (data.startsWith("lang_")) {
    const lang = data.split("_")[1];
    users[chatId] = { lang };
    return bot.sendMessage(chatId, LANG[lang].hello, mainMenu(lang));
  }

  const lang = users[chatId]?.lang || "ru";

  if (data === "book") {
    users[chatId].step = "floor";
    return bot.sendMessage(chatId, LANG[lang].chooseFloor, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "1️⃣ Этаж", callback_data: "floor_1" }],
          [{ text: "2️⃣ Этаж", callback_data: "floor_2" }],
          [{ text: LANG[lang].back, callback_data: "back_menu" }]
        ]
      }
    });
  }

  if (data.startsWith("floor_")) {
    users[chatId].floor = data.split("_")[1];
    users[chatId].step = "table";

    const rows = [];
    for (let i = 1; i <= 10; i += 2) {
      rows.push([
        { text: `🍽 ${i}`, callback_data: `table_${i}` },
        { text: `🍽 ${i + 1}`, callback_data: `table_${i + 1}` }
      ]);
    }
    rows.push([{ text: LANG[lang].back, callback_data: "book" }]);

    return bot.sendMessage(chatId, LANG[lang].chooseTable, {
      reply_markup: { inline_keyboard: rows }
    });
  }

  if (data.startsWith("table_")) {
    users[chatId].table = data.replace("table_", "");
    users[chatId].step = "date";
    return bot.sendMessage(chatId, LANG[lang].enterDate, {
      reply_markup: {
        inline_keyboard: [[{ text: LANG[lang].back, callback_data: "book" }]]
      }
    });
  }

  if (data === "back_menu") {
    return bot.sendMessage(chatId, LANG[lang].hello, mainMenu(lang));
  }
});

/* ================== TEXT STEPS ================== */
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const user = users[chatId];
  if (!user || !user.step) return;

  const lang = user.lang || "ru";

  if (user.step === "date") {
    user.date = msg.text;
    user.step = "name";
    return bot.sendMessage(chatId, LANG[lang].enterName);
  }

  if (user.step === "name") {
    user.name = msg.text;
    user.step = "phone";
    return bot.sendMessage(chatId, LANG[lang].enterPhone);
  }

  if (user.step === "phone") {
    user.phone = msg.text;
    user.step = null;

    const adminText =
`📩 НОВАЯ БРОНЬ
🏢 Этаж: ${user.floor}
🍽 Стол: ${user.table}
📅 Дата: ${user.date}
👤 Имя: ${user.name}
📞 Телефон: ${user.phone}`;

    ADMINS.forEach(id => bot.sendMessage(id, adminText));

    return bot.sendMessage(chatId, LANG[lang].done, mainMenu(lang));
  }
});

console.log("🤖 Bot started successfully");
