require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Добро пожаловать!\n\nНажмите кнопку ниже, чтобы сделать заказ 👇",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🍽 Сделать заказ",
              web_app: { url: process.env.MINIAPP_URL }
            }
          ]
        ]
      }
    }
  );
});

// Получение заказа из Mini App
bot.on("message", (msg) => {
  if (!msg.web_app_data) return;

  let order;
  try {
    order = JSON.parse(msg.web_app_data.data);
  } catch {
    return;
  }

  let text = `📦 <b>Новый заказ</b>\n\n`;

  order.items.forEach((item) => {
    text += `• ${item.name} — ${item.price} сум\n`;
  });

  text += `\n💰 <b>Итого:</b> ${order.total} сум`;
  text += `\n🚚 <b>Тип:</b> ${order.delivery}`;
  text += `\n👤 <b>Имя:</b> ${order.name}`;
  text += `\n📞 <b>Телефон:</b> ${order.phone}`;

  bot.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: "HTML" });
});

console.log("🤖 Bot is running");
