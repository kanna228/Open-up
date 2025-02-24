const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const Post = require('../models/post'); // Импорт модели Post
const authenticate = require('../middleware/authenticate');

router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    const profileUser = await User.findById(userId).lean();
    if (!profileUser) {
      return res.status(404).send('Пользователь не найден');
    }
    // Получаем посты пользователя
    let posts = await Post.find({ user_id: userId }).lean();

    // Для каждого поста, если установлен флаг media, читаем файлы из папки ./add/{postId}
    posts = posts.map(post => {
      if (post.media) {
        const dirPath = path.join(__dirname, '../add', post._id.toString());
        if (fs.existsSync(dirPath)) {
          try {
            const files = fs.readdirSync(dirPath);
            post.images = files; // Записываем список файлов в свойство images
          } catch (err) {
            console.error('Ошибка чтения директории:', err);
            post.images = [];
          }
        } else {
          post.images = [];
        }
      } else {
        post.images = [];
      }
      return post;
    });

    res.render('profile-view', { profileUser, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;
