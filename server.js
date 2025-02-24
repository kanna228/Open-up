// server.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');
const authenticate = require('./middleware/authenticate');
const app = express();
const jwt = require('jsonwebtoken'); // Важно: не забудьте установить через npm install jsonwebtoken

// Подключаемся к базе данных
connectDB();

// Настройка шаблонизатора EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));
app.use('/add', express.static(path.join(__dirname, 'add')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Глобальный middleware, чтобы res.locals.user был доступен во всех шаблонах
app.use((req, res, next) => {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        res.locals.currentUser = decoded; // Используем currentUser для залогиненного пользователя
      } catch (err) {
        console.error('Ошибка верификации токена', err);
        req.user = null;
        res.locals.currentUser = null;
      }
    } else {
      req.user = null;
      res.locals.currentUser = null;
    }
    next();
  });
  

// Подключаем маршруты
const homeRoutes = require('./routes/home');
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const logoutRoutes = require('./routes/logout');
const peopleNearRoutes = require('./routes/people-near');
const postRoutes = require('./routes/post');



app.use('/', homeRoutes, loginRoutes, registerRoutes, logoutRoutes, peopleNearRoutes, postRoutes);

const profileRoutes = require('./routes/profile');
app.use('/profile', authenticate, profileRoutes);

const profileViewRoutes = require('./routes/profile-view');
app.use('/profile-view', authenticate, profileViewRoutes);

const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
