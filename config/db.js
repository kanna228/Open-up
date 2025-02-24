const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: "Blog_platform"
    });
    console.log('✅ Успешное подключение к MongoDB Atlas');
};

module.exports = connectDB;
