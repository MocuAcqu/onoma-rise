require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors()); // 允許跨域請求
app.use(express.json()); // 解析 JSON 格式的 body

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log(err));

app.post('/api/auth/login', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: '密碼錯誤' });
      }

      return res.json({ 
        msg: 'Login success', 
        user: { username: user.username, email: user.email } 
      });

    } else {
      const finalUsername = username || email.split('@')[0];

      // 建立新使用者
      user = new User({
        username: finalUsername,
        email,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      return res.json({ 
        msg: 'Register success', 
        user: { username: user.username, email: user.email } 
      });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { email, name, googleId } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      // 舊用戶直接回傳
      return res.json({ 
        msg: 'Google Login success', 
        user: { username: user.username, email: user.email } 
      });
    } else {
      // 新用戶自動註冊
      // 生成一個隨機密碼 (因為使用者是用 Google 登入，這個密碼其實用不到，但 DB 欄位 required)
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        username: name,
        email,
        password: hashedPassword,
        googleId
      });

      await user.save();

      return res.json({ 
        msg: 'Google Register success', 
        user: { username: user.username, email: user.email } 
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));