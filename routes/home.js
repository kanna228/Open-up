const express = require('express');
const router = express.Router();

// Главная страница
router.get('/', (req, res) => {
  res.render('home'); // Отрисовка файла views/home.ejs
});

module.exports = router;
