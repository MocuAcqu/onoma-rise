const express = require('express');

const User = require('../models/User');

const router = express.Router();

function requireUsername(req, res) {
  const { username } = req.body;
  if (!username) {
    res.status(400).send('未登入');
    return null;
  }
  return username;
}

router.post('/progress/quiz', async (req, res) => {
  const { username, topicId, passed } = req.body;
  if (!username) {
    return res.status(400).json({ msg: '未登入' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ msg: '找不到使用者' });
  }

  const quiz = user.quizRecords.find(record => record.topicId === topicId);
  if (quiz) {
    quiz.attempts += 1;
    if (passed) quiz.passed = true;
  } else {
    user.quizRecords.push({ topicId, attempts: 1, passed });
  }

  await user.save();
  return res.json(user.quizRecords);
});

function progressRoute(field) {
  return async (req, res) => {
    const username = requireUsername(req, res);
    if (!username) return;

    await User.findOneAndUpdate({ username }, { [field]: true });
    res.send('Success');
  };
}

router.post('/progress/about', progressRoute('visitedAbout'));
router.post('/progress/audio-identify', progressRoute('usedAudioIdentify'));
router.post('/progress/score-identify', progressRoute('usedScoreIdentify'));

router.get('/dashboard/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res.status(404).json({ msg: '找不到使用者' });
  }

  return res.json({
    viewedChapters: user.viewedChapters,
    likedChapters: user.likedChapters,
    visitedAbout: user.visitedAbout,
    usedTonnetz: user.usedTonnetz,
    usedAudioIdentify: user.usedAudioIdentify || false,
    usedScoreIdentify: user.usedScoreIdentify || false,
    quizRecords: user.quizRecords,
  });
});

module.exports = router;
