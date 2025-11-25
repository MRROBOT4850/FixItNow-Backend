const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', ReviewSchema);
