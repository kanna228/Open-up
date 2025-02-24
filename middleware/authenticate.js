// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  
  // Если нет токена, отправляем на логин
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Ошибка при верификации токена:', error);
    return res.redirect('/login');
  }
};

module.exports = authenticate;
