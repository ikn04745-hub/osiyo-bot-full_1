require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// ===== /start =====
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Добро пожаловать!\n\nВыберите язык:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
          [{ text: "🇺🇿 O‘zbekcha", callback_data: "lang_uz" }],
          [{ text: "🇬🇧 English", callback_data: "lang_en" }],
        ],
      },
    }
  );
});

// ===== язык =====
bot.on("callback_query", (q) => {
  const chatId = q.message.chat.id;

  if (q.data.startsWith("lang_")) {
    bot.sendMessage(
      chatId,
      "🤖 Я менеджер ресторана.\nЧем могу помочь?",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🍽 Забронировать", callback_data: "reserve" }],
            [{ text: "ℹ️ О ресторане", callback_data: "about" }],
            [
              {
                text: "🛵 Доставка",
                web_app: { url: process.env.MINIAPP_URL },
              },
            ],
          ],
        },
      }
    );
  }
});

// ===== ПРИЁМ ЗАКАЗА ИЗ MINI APP =====
bot.on("web_app_data", async (msg) => {
  try {
    const order = JSON.parse(msg.web_app_data.data);

    let text = "📦 <b>НОВЫЙ ЗАКАЗ</b>\n\n";

    order.items.forEach((item) => {
      text += `• ${item.name} — ${item.price} сум\n`;
    });

    text += `\n💰 <b>Итого:</b> ${order.total} сум`;
    text += `\n📍 <b>Тип:</b> ${order.delivery}`;
    text += `\n👤 <b>Имя:</b> ${order.name}`;
    text += `\n📞 <b>Тел:</b> ${order.phone}`;

    await bot.sendMessage(ADMIN_CHAT_ID, text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Принять", callback_data: "order_accept" },
            { text: "❌ Отклонить", callback_data: "order_decline" },
          ],
        ],
      },
    });

    bot.sendMessage(msg.chat.id, "✅ Заказ отправлен менеджеру!");

  } catch (err) {
    console.error("Ошибка web_app_data:", err);
  }
});

// ===== КНОПКИ АДМИНА =====
bot.on("callback_query", (q) => {
  if (q.data === "order_accept") {
    bot.sendMessage(q.message.chat.id, "✅ Заказ принят");
  }

  if (q.data === "order_decline") {
    bot.sendMessage(q.message.chat.id, "❌ Заказ отклонён");
  }
});

console.log("🤖 Бот запущен");
