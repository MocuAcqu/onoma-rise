const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const router = express.Router();

function publicUser(user) {
  return { username: user.username, email: user.email };
}

router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  let user = await User.findOne({ email });

  if (user) {
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ msg: '密碼錯誤' });
    }

    return res.json({ msg: 'Login success', user: publicUser(user) });
  }

  user = new User({
    username: username || email.split('@')[0],
    email,
    password: await bcrypt.hash(password, 10),
  });
  await user.save();

  return res.json({ msg: 'Register success', user: publicUser(user) });
});

router.post('/google', async (req, res) => {
  const { email, name, googleId } = req.body;
  let user = await User.findOne({ email });

  if (user) {
    return res.json({ msg: 'Google Login success', user: publicUser(user) });
  }

  const randomPassword = Math.random().toString(36).slice(-8)
    + Math.random().toString(36).slice(-8);
  user = new User({
    username: name,
    email,
    password: await bcrypt.hash(randomPassword, 10),
    googleId,
  });
  await user.save();

  return res.json({ msg: 'Google Register success', user: publicUser(user) });
});

module.exports = router;
