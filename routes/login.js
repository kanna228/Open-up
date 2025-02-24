const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Используем bcryptjs
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/login', (req, res) => {
  // Если токен уже установлен, пытаемся его проверить
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Если токен валиден, перенаправляем на страницу профиля
      return res.redirect('/profile/' + decoded.id);
    } catch (err) {
      console.error('Невалидный токен', err);
      // Если токен недействителен, его можно удалить или просто продолжить
    }
  }
  
  // Если токена нет или он недействителен, отрисовываем страницу логина
  const { error } = req.query;
  res.render('login', { error });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверка наличия email и пароля
    if (!email || !password) {
      return res.redirect('/login?error=Email и пароль обязательны.');
    }

    // Поиск пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect('/login?error=Неверный email или пароль.');
    }

    // Сравнение переданного пароля с хэшированным паролем из базы
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect('/login?error=Неверный email или пароль.');
    }

    // Создаем полезную нагрузку для токена
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    // Генерируем JWT со сроком действия 1 час
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Устанавливаем токен в HTTP-only cookie и перенаправляем на страницу /profile/:id
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
    res.redirect('/profile/' + user._id);
  } catch (err) {
    console.error(err);
    return res.redirect('/login?error=Ошибка сервера');
  }
});

module.exports = router;
