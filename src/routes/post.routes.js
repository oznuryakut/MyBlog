const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Category = require('../models/category.model');
const { isLoggedIn } = require('../middleware/auth.middleware');

// Ana sayfa — tüm yazılar
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ published: true })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    const categories = await Category.find();

    res.render('index', { posts, categories, searchQuery: '' });
  } catch (err) {
    res.render('index', { posts: [], categories: [] });
  }
});

// Yorum silme
router.delete('/yorum/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı' });

    // Eğer admin ya da yorum sahibi değilse engelle
    if (!req.user || (req.user.role !== 'admin' && comment.author.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Yetkiniz yok' });
    }

    // Burada remove yerine deleteOne kullanıyoruz
    await Comment.deleteOne({ _id: req.params.id });

    res.json({ message: 'Yorum başarıyla silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Yorum silinirken hata oluştu' });
  }
});

// Kategori sayfası
router.get('/kategori/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    const posts = await Post.find({ published: true, category: category._id })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.render('index', { posts, categories: [], activeCategory: category });
  } catch (err) {
    res.redirect('/');
  }
});

// Yazı detay sayfası
router.get('/yazi/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true })
      .populate('author', 'username')
      .populate('category', 'name slug');

    if (!post) return res.redirect('/');

    const comments = await Comment.find({ 
  post: post._id, 
  $or: [{ parentComment: null }, { parentComment: { $exists: false } }]
})
  .populate('author', 'username')
  .sort({ createdAt: -1 });

const replies = await Comment.find({ 
  post: post._id, 
  parentComment: { $exists: true, $ne: null } 
})
  .populate('author', 'username')
  .sort({ createdAt: 1 });

res.render('post', { post, comments, replies });


  } catch (err) {
    res.redirect('/');
  }
});

// Yazı ara
router.get('/ara', async (req, res) => {
  try {
    const q = req.query.q || '';
    const posts = await Post.find({
      published: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    const categories = await Category.find();
    res.render('index', { posts, categories, searchQuery: q });
  } catch (err) {
    res.redirect('/');
  }
});

// Yorum beğen
router.post('/yorum/:id/begen', isLoggedIn, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const userId = req.session.user.id;
    const liked = comment.likes.includes(userId);

    if (liked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    res.json({ success: true, count: comment.likes.length, liked: !liked });
  } catch (err) {
    res.json({ success: false });
  }
});

// Yorum ekle
router.post('/yazi/:slug/yorum', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    await Comment.create({
      content: req.body.content,
      author: req.session.user.id,
      post: post._id
    });
    res.redirect('/yazi/' + req.params.slug);
  } catch (err) {
    res.redirect('/');
  }
});
// Yoruma yanıt ekle
router.post('/yazi/:slug/yorum/:commentId/yanit', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug });
    await Comment.create({
      content: req.body.content,
      author: req.session.user.id,
      post: post._id,
      parentComment: req.params.commentId
    });
    res.redirect('/yazi/' + req.params.slug);
  } catch (err) {
    res.redirect('/');
  }
});


module.exports = router;