const mongoose = require('mongoose');
const { deleteCloudinaryImages } = require('../utils/cloudinaryCleanup');

const RequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  type: { type: String, required: true },
  description: { type: String },
  photos: [String], // Cloudinary URLs
  address: {
    state: String,
    district: String,
    tehsil: String,
  },
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'resolved', 'cancelled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

/**
 * Cascade cleanup when a request is deleted
 * - Remove all related Cloudinary images
 */
RequestSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    if (this.photos && this.photos.length) {
      await deleteCloudinaryImages(this.photos);
    }
    next();
  } catch (err) {
    console.error('Request cleanup failed:', err.message);
    next(err);
  }
});

module.exports = mongoose.model('Request', RequestSchema);
