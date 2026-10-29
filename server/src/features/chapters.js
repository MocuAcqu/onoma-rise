const express = require('express');

const Chapter = require('../models/Chapter');
const User = require('../models/User');

const router = express.Router();

async function findOrCreateChapter(chapterId) {
  const existing = await Chapter.findOne({ chapterId });
  return existing || new Chapter({ chapterId });
}

router.get('/:chapterId', async (req, res) => {
  const chapter = await findOrCreateChapter(req.params.chapterId);
  if (chapter.isNew) {
    await chapter.save();
  }
  res.json(chapter);
});

router.post('/:chapterId/view', async (req, res) => {
  const { chapterId } = req.params;
  const { username } = req.body;
  const chapter = await findOrCreateChapter(chapterId);

  chapter.views += 1;
  await chapter.save();

  if (username) {
    await User.findOneAndUpdate(
      { username },
      { $addToSet: { viewedChapters: chapterId } },
    );
  }

  res.json(chapter);
});

router.post('/:chapterId/like', async (req, res) => {
  const { chapterId } = req.params;
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ msg: '需登入才能按讚' });
  }

  const chapter = await findOrCreateChapter(chapterId);
  const hasLiked = chapter.likedBy.includes(username);

  if (hasLiked) {
    chapter.likedBy = chapter.likedBy.filter(user => user !== username);
    chapter.likes = Math.max(0, chapter.likes - 1);
    await User.findOneAndUpdate(
      { username },
      { $pull: { likedChapters: chapterId } },
    );
  } else {
    chapter.likedBy.push(username);
    chapter.likes += 1;
    await User.findOneAndUpdate(
      { username },
      { $addToSet: { likedChapters: chapterId } },
    );
  }

  await chapter.save();
  return res.json({ likes: chapter.likes, hasLiked: !hasLiked });
});

module.exports = router;
