const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Используем bcryptjs
const User = require('../models/user');

router.get('/register', (req, res) => {
  const { error } = req.query; // Извлекаем ошибку
  res.render('register', { error });
});

router.post('/register', async (req, res) => {
  try {
    const { name, surname, age, email, password } = req.body;

    if (!name || !surname || !age || !email || !password) {
      return res.redirect('/register?error=Все поля обязательны для заполнения.');
    }

    if (password.length <= 6) {
      return res.redirect('/register?error=Пароль должен содержать более 6 символов.');
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect('/register?error=Пользователь с таким email уже существует.');
    }

    // Хэшируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const newUser = new User({ name, surname, age, email, password: hashedPassword });
    await newUser.save();

    // После регистрации перенаправляем на логин
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    return res.redirect('/register?error=Ошибка сервера');
  }
});

module.exports = router;
