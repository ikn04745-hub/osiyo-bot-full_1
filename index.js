require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// ================== EXPRESS (Mini App) ==================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, () => {
  console.log("🌐 Mini App running on port " + PORT);
});

// ================== TELEGRAM BOT ==================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 👉 ОДИН ЧАТ ДЛЯ ВСЕХ АДМИНОВ
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// ================== USER STATE ==================
const users = {};

// ================== LANGUAGES ==================
const LANG = {
  ru: {
    chooseLang: "🌍 Выберите язык",
    welcome: "👋 Я бот-менеджер ресторана. Чем могу помочь?",
    book: "📅 Забронировать",
    about: "ℹ️ О ресторане",
    delivery: "🚚 Доставка",
    back: "⬅️ Назад",
    floor: "🏢 Выберите этаж",
    table: "🍽 Выберите стол",
    date: "📅 Укажите дату брони",
    name: "👤 Ваше имя",
    phone: "📞 Номер телефона",
    done: "✅ Заявка принята! Менеджер скоро свяжется с вами."
  },
  en: {
    chooseLang: "🌍 Choose language",
    welcome: "👋 I am the restaurant manager bot. How can I help?",
    book: "📅 Reservation",
    about: "ℹ️ About restaurant",
    delivery: "🚚 Delivery",
    back: "⬅️ Back",
    floor: "🏢 Choose floor",
    table: "🍽 Choose table",
    date: "📅 Reservation date",
    name: "👤 Your name",
    phone: "📞 Phone number",
    done: "✅ Request received! Manager will contact you."
  },
  uz: {
    chooseLang: "🌍 Tilni tanlang",
    welcome: "👋 Men restoran menejer botiman. Qanday yordam beraman?",
    book: "📅 Bron qilish",
    about: "ℹ️ Restoran haqida",
    delivery: "🚚 Yetkazib berish",
    back: "⬅️ Orqaga",
    floor: "🏢 Qavatni tanlang",
    table: "🍽 Stolni tanlang",
    date: "📅 Sana",
    name: "👤 Ismingiz",
    phone: "📞 Telefon raqam",
    done: "✅ So‘rov qabul qilindi! Menejer bog‘lanadi."
  }
};

// ================== /START ==================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  users[chatId] = {};

  bot.sendMessage(chatId, LANG.ru.chooseLang, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
        [{ text: "🇬🇧 English", callback_data: "lang_en" }],
        [{ text: "🇺🇿 O‘zbek", callback_data: "lang_uz" }]
      ]
    }
  });
});

// ================== CALLBACKS ==================
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // ===== Language select =====
  if (data.startsWith("lang_")) {
    const lang = data.split("_")[1];
    users[chatId] = { lang };

    return bot.sendMessage(chatId, LANG[lang].welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: LANG[lang].book, callback_data: "book" }],
          [{ text: LANG[lang].delivery, web_app: { url: process.env.MINIAPP_URL } }],
          [{ text: LANG[lang].about, callback_data: "about" }]
        ]
      }
    });
  }

  const lang = users[chatId]?.lang || "ru";

  // ===== Booking =====
  if (data === "book") {
    users[chatId].step = "floor";
    return bot.sendMessage(chatId, LANG[lang].floor, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "1️⃣ 1 этаж", callback_data: "floor_1" }],
          [{ text: "2️⃣ 2 этаж", callback_data: "floor_2" }],
          [{ text: LANG[lang].back, callback_data: "back_main" }]
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

    return bot.sendMessage(chatId, LANG[lang].table, {
      reply_markup: { inline_keyboard: rows }
    });
  }

  if (data.startsWith("table_")) {
    users[chatId].table = data.split("_")[1];
    users[chatId].step = "date";
    return bot.sendMessage(chatId, LANG[lang].date);
  }

  if (data === "about") {
    return bot.sendMessage(
      chatId,
      "📍 OSIYO RESTO\n🕒 10:00 – 23:00\n📞 +998 XX XXX XX XX",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: LANG[lang].back, callback_data: "back_main" }]
          ]
        }
      }
    );
  }

  if (data === "back_main") {
    return bot.sendMessage(chatId, LANG[lang].welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: LANG[lang].book, callback_data: "book" }],
          [{ text: LANG[lang].delivery, web_app: { url: process.env.MINIAPP_URL } }],
          [{ text: LANG[lang].about, callback_data: "about" }]
        ]
      }
    });
  }
});

// ================== TEXT STEPS ==================
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId] || !users[chatId].step) return;

  const lang = users[chatId].lang || "ru";

  if (users[chatId].step === "date") {
    users[chatId].date = msg.text;
    users[chatId].step = "name";
    return bot.sendMessage(chatId, LANG[lang].name);
  }

  if (users[chatId].step === "name") {
    users[chatId].name = msg.text;
    users[chatId].step = "phone";
    return bot.sendMessage(chatId, LANG[lang].phone);
  }

  if (users[chatId].step === "phone") {
    users[chatId].phone = msg.text;
    users[chatId].step = null;

    const text =
`📩 НОВАЯ БРОНЬ
🏢 Этаж: ${users[chatId].floor}
🍽 Стол: ${users[chatId].table}
📅 Дата: ${users[chatId].date}
👤 Имя: ${users[chatId].name}
📞 Телефон: ${users[chatId].phone}`;

    // 👉 УВЕДОМЛЕНИЕ В ОБЩИЙ ЧАТ АДМИНОВ
    bot.sendMessage(ADMIN_CHAT_ID, text);

    return bot.sendMessage(chatId, LANG[lang].done);
  }
});

console.log("🤖 Bot started successfully");
