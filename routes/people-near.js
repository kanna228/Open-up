const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authenticate = require('../middleware/authenticate');

router.get('/people-near', authenticate, async (req, res) => {
  try {
    let query = {};
    const q = req.query.q; // Поисковая строка
    if (q && q.trim() !== "") {
      const regex = new RegExp(q.trim(), 'i'); // RegExp с флагом 'i' для нечувствительности к регистру
      query = { 
        $or: [
          { name: regex },
          { surname: regex }
        ]
      };
    }
    
    let users = await User.find(query).lean();

    // Получаем id текущего пользователя из токена
    const currentUserId = req.user.id.toString();

    // Разбиваем список на текущего и остальных
    const currentUser = users.find(u => u._id.toString() === currentUserId);
    const otherUsers = users.filter(u => u._id.toString() !== currentUserId);

    if (currentUser) {
      currentUser.isCurrent = true;
    }
    const finalUsers = currentUser ? [currentUser, ...otherUsers] : users;

    res.render('people-near', { users: finalUsers, q: q || "" });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

module.exports = router;
