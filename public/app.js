const tg = window.Telegram.WebApp;
tg.expand();

const app = document.getElementById("app");

let cart = [];

// ВРЕМЕННЫЕ ДАННЫЕ
const menu = {
  "🍕 Пицца": [
    { id: 1, name: "Маргарита", price: 55000 },
    { id: 2, name: "Пепперони", price: 65000 }
  ],
  "🍔 Фастфуд": [
    { id: 3, name: "Бургер", price: 35000 },
    { id: 4, name: "Хот-дог", price: 25000 }
  ]
};

// ГЛАВНЫЙ ЭКРАН
function renderCategories() {
  app.innerHTML = `
    <h2>📂 Категории</h2>
    ${Object.keys(menu).map(cat =>
      `<button onclick="renderDishes('${cat}')">${cat}</button>`
    ).join("")}
    <br><br>
    <button onclick="renderCart()">🛒 Корзина (${cart.length})</button>
  `;
}

// БЛЮДА
function renderDishes(category) {
  app.innerHTML = `
    <h2>${category}</h2>
    ${menu[category].map(item => `
      <div style="margin-bottom:10px">
        <b>${item.name}</b> — ${item.price} сум
        <br>
        <button onclick="addToCart(${item.id}, '${item.name}', ${item.price})">➕ Добавить</button>
      </div>
    `).join("")}
    <br>
    <button onclick="renderCategories()">⬅️ Назад</button>
  `;
}

// ДОБАВИТЬ В КОРЗИНУ
function addToCart(id, name, price) {
  cart.push({ id, name, price });
  tg.showPopup({ message: `${name} добавлено в корзину` });
}

// КОРЗИНА
function renderCart() {
  if (cart.length === 0) {
    app.innerHTML = `
      <h2>🛒 Корзина пуста</h2>
      <button onclick="renderCategories()">⬅️ Назад</button>
    `;
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  app.innerHTML = `
    <h2>🛒 Корзина</h2>
    ${cart.map(i => `• ${i.name} — ${i.price} сум`).join("<br>")}
    <br><br>
    <b>💰 Итого: ${total} сум</b>
    <br><br>
    <button onclick="sendOrder()">📩 Отправить заказ</button>
    <br><br>
    <button onclick="renderCategories()">⬅️ Назад</button>
  `;
}

// ОТПРАВКА ЗАКАЗА В БОТА
function sendOrder() {
  const order = {
    items: cart,
    total,
    name: "Клиент",
    phone: "не указан",
    delivery: "Доставка"
  };

  tg.sendData(JSON.stringify(order));
  cart = [];

  app.innerHTML = `
    <h2>✅ Заказ отправлен!</h2>
    <button onclick="renderCategories()">🏠 В меню</button>
  `;
}

// СТАРТ
renderCategories();
