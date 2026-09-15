require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Chapter = require('./models/Chapter');

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
      return res.json({ 
        msg: 'Google Login success', 
        user: { username: user.username, email: user.email } 
      });
    } else {
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

app.get('/api/chapters/:chapterId', async (req, res) => {
  try {
    let chapter = await Chapter.findOne({ chapterId: req.params.chapterId });
    if (!chapter) {
      chapter = await Chapter.create({ chapterId: req.params.chapterId });
    }
    res.json(chapter);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/chapters/:chapterId/view', async (req, res) => {
  const { username } = req.body;
  try {
    let chapter = await Chapter.findOne({ chapterId: req.params.chapterId });
    if (!chapter) {
      chapter = new Chapter({ chapterId: req.params.chapterId });
    }
    
    chapter.views += 1;
    await chapter.save();

    if (username) {
      await User.findOneAndUpdate(
        { username },
        { $addToSet: { viewedChapters: req.params.chapterId } }
      );
    }
    
    res.json(chapter);
  } catch (err) {
    console.error("【/view API 錯誤】:", err.message); 
    res.status(500).send('Server Error');
  }
});

app.post('/api/chapters/:chapterId/like', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ msg: '需登入才能按讚' });

  try {
    let chapter = await Chapter.findOne({ chapterId: req.params.chapterId });
    if (!chapter) chapter = new Chapter({ chapterId: req.params.chapterId });

    const hasLiked = chapter.likedBy.includes(username);

    if (hasLiked) {
      chapter.likedBy = chapter.likedBy.filter(user => user !== username);
      chapter.likes = Math.max(0, chapter.likes - 1);
      await User.findOneAndUpdate({ username }, { $pull: { likedChapters: req.params.chapterId } });
    } else {
      chapter.likedBy.push(username);
      chapter.likes += 1;
      await User.findOneAndUpdate({ username }, { $addToSet: { likedChapters: req.params.chapterId } });
    }
    await chapter.save();
    res.json({ likes: chapter.likes, hasLiked: !hasLiked });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/user/progress/quiz', async (req, res) => {
  const { username, topicId, passed } = req.body;
  if (!username) return res.status(400).json({ msg: '未登入' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: '找不到使用者' });

    const quizIndex = user.quizRecords.findIndex(q => q.topicId === topicId);

    if (quizIndex > -1) {
      user.quizRecords[quizIndex].attempts += 1;
      if (passed) user.quizRecords[quizIndex].passed = true;
    } else {
      user.quizRecords.push({ topicId, attempts: 1, passed });
    }

    await user.save();
    res.json(user.quizRecords);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/user/progress/about', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('未登入');
  try {
    await User.findOneAndUpdate({ username }, { visitedAbout: true });
    res.send('Success');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/user/dashboard/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ msg: '找不到使用者' });

    res.json({
      viewedChapters: user.viewedChapters,
      likedChapters: user.likedChapters,
      visitedAbout: user.visitedAbout,
      usedTonnetz: user.usedTonnetz,
      quizRecords: user.quizRecords
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));