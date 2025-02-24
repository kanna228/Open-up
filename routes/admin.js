const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Импорт модели пользователя
const Post = require('../models/post'); // Импорт модели постов

router.post('/delete-user', async (req, res) => {
    const { userId } = req.body;

    try {
        // Удаляем все посты, у которых user_id равен userId
        await Post.deleteMany({ user_id: userId });

        // Затем удаляем пользователя
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).send('Пользователь не найден');
        }
        res.redirect('/profile'); // Перенаправляем обратно в профиль
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при удалении пользователя');
    }
});

module.exports = router;
