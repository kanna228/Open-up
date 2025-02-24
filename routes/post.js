// routes/post.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');
const authenticate = require('../middleware/authenticate');

// Настройка multer: сохраняем файл во временную папку "temp"
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      const tempDir = './temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
const upload = multer({ storage: storage });

// GET /post/create/:id — отображает форму создания поста для пользователя с данным id
router.get('/post/create/:id', authenticate, (req, res) => {
  // Можно дополнительно проверить, что req.user.id совпадает с :id
  res.render('createPost', { userId: req.params.id });
});

// POST /post/create/:id — обрабатывает форму создания поста, загружая картинку (если есть)
router.post('/post/create/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { title, main_info } = req.body;
    
    let media = false;
    // Если файл был загружен, устанавливаем media в true
    if (req.file) {
      media = true;
    }
    
    // Создаем новый пост. Обратите внимание, что _id будет сгенерирован автоматически.
    const newPost = new Post({
      user_id: userId,
      title,
      main_info,
      media
    });
    
    await newPost.save();
    
    // Если файл был загружен, перемещаем его из временной папки в папку /add/{postId}/
    if (req.file) {
      // Определяем папку назначения: ./add/{postId}/
      const destDir = path.join('add', newPost._id.toString());
      
      // Создаем папку, если ее нет
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Определяем конечный путь файла: ./add/{postId}/{filename}
      const destPath = path.join(destDir, req.file.filename);
      
      // Перемещаем файл
      fs.rename(req.file.path, destPath, (err) => {
        if (err) {
          console.error('Ошибка перемещения файла:', err);
        } else {
          console.log('Файл успешно перемещен в:', destPath);
        }
      });
    }
    
    // После создания поста перенаправляем на профиль пользователя
    res.redirect('/profile/' + userId);
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
});

// DELETE-подобный маршрут (используем GET для простоты примера, но лучше метод DELETE)
router.get('/post/delete/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      
      // Ищем пост в базе
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).send('Пост не найден');
      }
      
      // Проверяем, что пользователь имеет право удалять (владелец поста или админ)
      if (post.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).send('У вас нет прав на удаление этого поста');
      }
      
      // Удаляем пост из базы (заменили findByIdAndRemove на findByIdAndDelete)
      await Post.findByIdAndDelete(postId);
      
      // Удаляем папку ./add/{postId}, если она существует
      const dirPath = path.join(__dirname, '../add', postId);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      
      // Возвращаемся на профиль пользователя
      res.redirect('/profile/' + req.user.id);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка сервера');
    }
  });

// GET /post/edit/:id — отображает форму редактирования поста
router.get('/post/edit/:id', authenticate, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await Post.findById(postId).lean();
      if (!post) {
        return res.status(404).send('Пост не найден');
      }
      // Проверяем, что редактировать может только владелец поста или админ
      if (post.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).send('У вас нет прав на редактирование этого поста');
      }
      res.render('editPost', { post });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка сервера');
    }
  });

  router.post('/post/edit/:id', authenticate, upload.single('image'), async (req, res) => {
    try {
      const postId = req.params.id;
      const { title, main_info, deleteImage } = req.body;
      
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).send('Пост не найден');
      }
      
      // Проверяем права редактирования
      if (post.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).send('У вас нет прав на редактирование этого поста');
      }
      
      // Обновляем поля поста
      post.title = title;
      post.main_info = main_info;
      
      // Если пользователь выбрал удаление текущего изображения
      if (deleteImage === 'on') {
        const dirPath = path.join(__dirname, '../add', postId);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
        post.media = false;
      }
      
      // Если загружено новое изображение, перемещаем его
      if (req.file) {
        // Удаляем старую папку, если она существует
        const dirPath = path.join(__dirname, '../add', postId);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
        // Создаем новую папку
        fs.mkdirSync(dirPath, { recursive: true });
        const destPath = path.join(dirPath, req.file.filename);
        fs.renameSync(req.file.path, destPath);
        post.media = true;
      }
      
      await post.save();
      res.redirect('/profile/' + req.user.id);
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка сервера');
    }
  });

  // GET /post — вывод всех постов, отсортированных по created_at (новейшие сверху)
  router.get('/posts', authenticate, async (req, res) => {
    try {
      let posts = await Post.find({})
        .sort({ created_at: -1 })
        .populate('user_id', 'name surname _id')
        .lean();
      
      // Для каждого поста, если media === true, читаем файлы из папки ./add/{postId}
      posts = posts.map(post => {
        if (post.media) {
          const dirPath = path.join(__dirname, '../add', post._id.toString());
          if (fs.existsSync(dirPath)) {
            try {
              const files = fs.readdirSync(dirPath);
              post.images = files;
            } catch (err) {
              console.error('Ошибка чтения директории для поста ' + post._id, err);
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
      
      res.render('allPosts', { posts, currentUser: res.locals.currentUser });
    } catch (err) {
      console.error(err);
      res.status(500).send('Ошибка сервера');
    }
  });
  
  
  

module.exports = router;
