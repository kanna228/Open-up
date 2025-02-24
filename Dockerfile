# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем весь код проекта в контейнер
COPY . .

# Открываем порт (например, 3000 для Express.js)
EXPOSE 3000

# Запускаем сервер
CMD ["node", "server.js"]