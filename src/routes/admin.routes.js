const { v2: cloudinary } = require('cloudinary');

const upload = require('../config/cloudinary');
const upload = require('../middleware/upload.js');
const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const Category = require('../models/category.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const { isAdmin } = require('../middleware/auth.middleware');

router.use(isAdmin);

router.get('/', async (req, res) => {
  try {
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    const userCount = await User.countDocuments();
    const categoryCount = await Category.countDocuments();
    const posts = await Post.find()
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const categories = await Category.find();
res.render('admin/dashboard', { postCount, commentCount, userCount, categoryCount, posts, categories });
  } catch (err) {
    console.error('DASHBOARD HATASI:', err.message);
    res.redirect('/');
  }
});

router.get('/yazi/yeni', async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('admin/post-form', { post: null, categories, error: null });
  } catch (err) {
    console.error('YAZI FORM HATASI:', err.message);
    res.send(err.message);
  }
});

router.post('/yazi/yeni', upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, published } = req.body;
    
    // Değişen kısım burası: req.file.path artık Cloudinary URL'sini tutuyor
    const imageUrl = req.file ? req.file.path : null;

    await Post.create({
      title,
      content,
      excerpt: content.substring(0, 150) + '...',
      category: category || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      published: published === 'on',
      author: req.session.user.id,
      image: imageUrl // Artık veritabanına "https://res.cloudinary.com/..." şeklinde kaydedilecek
    });

    res.redirect('/admin');
  } catch (err) {
    console.error('YAZI KAYIT HATASI:', err.message);
    const categories = await Category.find();
    res.render('admin/post-form', { post: null, categories, error: err.message });
  }
});

router.get('/yazi/duzenle/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const categories = await Category.find();
    res.render('admin/post-form', { post, categories, error: null });
  } catch (err) {
    console.error('DÜZENLE FORM HATASI:', err.message);
    res.redirect('/admin');
  }
});

router.post('/yazi/duzenle/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, published } = req.body;
    const post = await Post.findById(req.params.id);
    post.title = title;
    post.content = content;
    post.excerpt = content.substring(0, 150) + '...';
    post.category = category || null;
    post.tags = tags ? tags.split(',').map(t => t.trim()) : [];
    post.published = published === 'on';
    if (req.file) post.image = '/uploads/' + req.file.filename;
    await post.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('GÜNCELLEME HATASI:', err.message);
    res.redirect('/admin');
  }
});
router.post('/yazi/sil/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    res.redirect('/admin');
  } catch (err) {
    console.error('YAZI SİL HATASI:', err.message);
    res.redirect('/admin');
  }
});

router.post('/kategori/ekle', async (req, res) => {
  try {
    await Category.create({ name: req.body.name, description: req.body.description });
    res.redirect('/admin');
  } catch (err) {
    console.error('KATEGORİ HATASI:', err.message);
    res.redirect('/admin');
  }
});

router.post('/kategori/sil/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    console.error('KATEGORİ SİL HATASI:', err.message);
    res.redirect('/admin');
  }
});

module.exports = router;