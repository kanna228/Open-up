const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Post = require('../models/post');

// 1) GET /profile/
// Если пользователь просто переходит на /profile, перенаправляем на /profile/:id (его собственный ID)
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/login');
    }
    const userId = req.user.id;
    return res.redirect(`/profile/${userId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Ошибка сервера');
  }
});
 
// 2) GET /profile/:id
// Отображение профиля пользователя по конкретному ID вместе с его постами
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).send('Пользователь не найден');
    }

    // Находим все посты, созданные этим пользователем
    const posts = await Post.find({ user_id: userId }).lean();

    // Если у поста установлен флаг media, читаем файлы из папки add/{postId}
    for (let post of posts) {
      if (post.media) {
        const postDir = path.join(__dirname, '../add', post._id.toString());
        if (fs.existsSync(postDir)) {
          const files = fs.readdirSync(postDir);
          post.images = files;
        } else {
          post.images = [];
        }
      } else {
        post.images = [];
      }
    }

    // Рендерим шаблон, передавая данные о пользователе и его постах
    res.render('profile', { user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// 3) GET /profile/:id/edit
// Отображаем форму для редактирования данных
router.get('/:id/edit', async (req, res) => {
  try {
    const userId = req.params.id;

    // Проверяем, что пользователь авторизован и ID совпадает
    if (!req.user || req.user.id !== userId) {
      return res.redirect('/login');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).send('Пользователь не найден');
    }

    res.render('editProfile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// 4) POST /profile/:id/edit
// Обновляем данные пользователя в базе
router.post('/:id/edit', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.user || req.user.id !== userId) {
      return res.redirect('/login');
    }

    const { name, surname, age, email, password, user_info } = req.body;

    // Находим пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('Пользователь не найден');
    }

    // Обновляем поля, если они пришли
    user.name = name;
    user.surname = surname;
    user.age = age;
    user.email = email;
    user.user_info = user_info;

    // Если пользователь ввёл новый пароль, меняем его
    if (password && password.length > 0) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    // После обновления перенаправляем обратно на профиль
    res.redirect(`/profile/${userId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;
