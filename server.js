const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы Mini App
app.use(express.static(path.join(__dirname, "public")));

// Главная Mini App
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("🌐 Mini App сервер запущен на порту", PORT);
});
