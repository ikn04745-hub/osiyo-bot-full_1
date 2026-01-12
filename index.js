require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const MAIN_ADMIN = Number(process.env.ADMIN_ID);
const ADMINS = [MAIN_ADMIN];

const users = {};

const LANG = {
  ru: {
    hello: "🤖 Я бот-менеджер ресторана.\nЧем могу помочь?",
    book: "📅 Забронировать",
    about: "ℹ️ О ресторане",
    delivery: "🚚 Доставка",
    back: "⬅️ Назад",
    floor: "🏢 Выберите этаж",
    table: "🍽 Выберите стол",
    date: "📅 Дата бронирования",
    name: "👤 Ваше имя",
    phone: "📞 Телефон",
    done: "✅ Заявка принята! Менеджер свяжется с вами."
  }
};

function mainMenu(chatId) {
  bot.sendMessage(chatId, LANG.ru.hello, {
    reply_markup: {
      inline_keyboard: [
        [{ text: LANG.ru.book, callback_data: "book" }],
        [{ text: LANG.ru.delivery, web_app: { url: process.env.MINIAPP_URL } }],
        [{ text: LANG.ru.about, callback_data: "about" }]
      ]
    }
  });
}

bot.onText(/\/start/, (msg) => {
  users[msg.chat.id] = { step: "menu" };
  mainMenu(msg.chat.id);
});

bot.on("callback_query", (q) => {
  const chatId = q.message.chat.id;
  const user = users[chatId];

  if (q.data === "book") {
    user.step = "floor";
    bot.sendMessage(chatId, LANG.ru.floor, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "1️⃣ Этаж", callback_data: "floor_1" }],
          [{ text: "2️⃣ Этаж", callback_data: "floor_2" }],
          [{ text: LANG.ru.back, callback_data: "menu" }]
        ]
      }
    });
  }

  if (q.data.startsWith("floor_")) {
    user.floor = q.data.split("_")[1];
    user.step = "table";

    const tables = [];
    for (let i = 1; i <= 10; i += 2) {
      tables.push([
        { text: `🍽 ${i}`, callback_data: `table_${i}` },
        { text: `🍽 ${i + 1}`, callback_data: `table_${i + 1}` }
      ]);
    }

    bot.sendMessage(chatId, LANG.ru.table, {
      reply_markup: { inline_keyboard: tables }
    });
  }

  if (q.data.startsWith("table_")) {
    user.table = q.data.replace("table_", "");
    user.step = "date";
    bot.sendMessage(chatId, LANG.ru.date);
  }

  if (q.data === "menu") {
    mainMenu(chatId);
  }

  if (q.data === "about") {
    bot.sendMessage(chatId,
      "📍 Osiyo Resto\n⏰ 10:00–23:00",
      { reply_markup: { inline_keyboard: [[{ text: LANG.ru.back, callback_data: "menu" }]] } }
    );
  }
});

bot.on("message", (msg) => {
  const user = users[msg.chat.id];
  if (!user) return;

  if (user.step === "date") {
    user.date = msg.text;
    user.step = "name";
    return bot.sendMessage(msg.chat.id, LANG.ru.name);
  }

  if (user.step === "name") {
    user.name = msg.text;
    user.step = "phone";
    return bot.sendMessage(msg.chat.id, LANG.ru.phone);
  }

  if (user.step === "phone") {
    user.phone = msg.text;

    const text =
`📩 НОВАЯ БРОНЬ

🏢 Этаж: ${user.floor}
🍽 Стол: ${user.table}
📅 Дата: ${user.date}
👤 Имя: ${user.name}
📞 Телефон: ${user.phone}`;

    ADMINS.forEach(id => bot.sendMessage(id, text));

    user.step = "menu";
    bot.sendMessage(msg.chat.id, LANG.ru.done);
    mainMenu(msg.chat.id);
  }
});
