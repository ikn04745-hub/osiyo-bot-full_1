const tg = window.Telegram.WebApp;
tg.expand();

document.getElementById("app").innerHTML = `
<button onclick="sendOrder()">📩 Отправить тест-заказ</button>
`;

function sendOrder() {
  tg.sendData(JSON.stringify({
    items: ["🍕 Пицца", "🍔 Бургер"],
    total: 90000
  }));
}
