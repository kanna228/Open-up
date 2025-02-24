// routes/logout.js
const express = require('express');
const router = express.Router();

// GET /logout — очищаем cookie и перенаправляем на страницу логина
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
