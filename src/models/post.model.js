const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [String],
  image: { type: String },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

postSchema.pre('save', async function() {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (this.isModified('content')) {
    this.excerpt = this.content.substring(0, 150) + '...';
  }
});

module.exports = mongoose.model('Post', postSchema);