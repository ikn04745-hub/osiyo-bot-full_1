const tg = window.Telegram.WebApp;
tg.expand();

const app = document.getElementById("app");

const cart = [
  { name: "🍕 Пицца Маргарита", price: 55000 },
  { name: "🍔 Бургер", price: 35000 }
];

function renderCart() {
  const total = cart.reduce((s, i) => s + i.price, 0);

  app.innerHTML = `
    ${cart.map(i => `<p>${i.name} — ${i.price} сум</p>`).join("")}
    <hr>
    <b>Итого: ${total} сум</b>
    <br><br>
    <button id="sendOrder">📩 Отправить заказ</button>
  `;

  document.getElementById("sendOrder").onclick = () => {
    tg.sendData(JSON.stringify({
      items: cart,
      total,
      delivery: "Доставка",
      name: "Нурик",
      phone: "99 794 48 06"
    }));
  };
}

renderCart();
