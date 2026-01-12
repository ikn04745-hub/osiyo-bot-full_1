require("dotenv").config();
const express = require("express");
const path = require("path");

require("./index"); // запускаем бота

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 Mini App server running on port", PORT);
});
