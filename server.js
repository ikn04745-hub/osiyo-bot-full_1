const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 👉 Mini App
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 👉 Запуск сервера
app.listen(PORT, () => {
  console.log(`🌐 Mini App работает на порту ${PORT}`);
});

// 👉 Запуск бота
require("./index");
