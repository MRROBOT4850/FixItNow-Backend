// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true, lowercase: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['user'], default: 'user' },
//   phone: String,
//   address: {
//     state: { type: String, required: true },
//     district: { type: String, required: true },
//     tehsil: { type: String, required: true },
//   },
//   location: {
//     type: { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
//   },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('User', UserSchema);
const mongoose = require('mongoose');
const Request = require('./Request');
const Review = require('./Review');
const { deleteCloudinaryImages } = require('../utils/cloudinaryCleanup');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user'], default: 'user' },
  phone: String,
  profilePhoto: String, // Cloudinary URL
  address: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    tehsil: { type: String, required: true },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now },
});

// Cascade delete user-related data
UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const userId = this._id;

    // 1. Delete all requests created by this user
    await Request.deleteMany({ requester: userId });

    // 2. Delete all reviews written by this user
    await Review.deleteMany({ author: userId });

    // 3. Delete user profile photo from Cloudinary if exists
    if (this.profilePhoto) await deleteCloudinaryImages(this.profilePhoto);

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);
