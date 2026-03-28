const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { isGuest } = require('../middleware/auth.middleware');

// Kayıt sayfası
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', { error: null });
});

// Kayıt işlemi
router.post('/register', isGuest, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.render('auth/register', { error: 'Bu email veya kullanıcı adı zaten kullanımda.' });
    }

    const user = await User.create({ username, email, password });

    req.session.user = { id: user._id, username: user.username, role: user.role };
    res.redirect('/');
  } catch (err) {
    res.render('auth/register', { error: 'Bir hata oluştu.' });
  }
});

// Giriş sayfası
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', { error: null });
});

// Giriş işlemi
router.post('/login', isGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { error: 'Email veya şifre hatalı.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.render('auth/login', { error: 'Email veya şifre hatalı.' });
    }

    req.session.user = { id: user._id, username: user.username, role: user.role };

    if (user.role === 'admin') return res.redirect('/admin');
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { error: 'Bir hata oluştu.' });
  }
});

// Çıkış
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;