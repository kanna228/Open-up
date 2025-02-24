const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const User = require("../models/user"); // Модель пользователя
const Post = require("../models/post"); // Модель постов

router.post("/delete-user", async (req, res) => {
  const { userId } = req.body;

  try {
    // Находим все посты пользователя
    const posts = await Post.find({ user_id: userId }).lean();

    // Для каждого поста удаляем папку ./add/{postId}, если она существует
    for (let post of posts) {
      const dirPath = path.join(__dirname, "../add", post._id.toString());
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }

    // Удаляем все посты пользователя из базы
    await Post.deleteMany({ user_id: userId });

    // Затем удаляем пользователя
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send("Пользователь не найден");
    }
    res.redirect("/profile"); // Перенаправляем обратно в профиль
  } catch (error) {
    console.error(error);
    res.status(500).send("Ошибка при удалении пользователя");
  }
});

module.exports = router;
