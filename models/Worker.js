// const mongoose = require('mongoose');

// const WorkerSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true, lowercase: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['worker'], default: 'worker' },
//   phone: String,
//   workerType: { type: String, required: true },
//   experienceYears: { type: Number, default: 0 },
//   solvedCount: { type: Number, default: 0 },
//   availability: { type: Boolean, default: true },
//   ratingAvg: { type: Number, default: 0 },
//   reviewsCount: { type: Number, default: 0 },
//   address: {
//     state: { type: String, required: true },
//     district: { type: String, required: true },
//     tehsil: { type: String, required: true },
//   },
//   location: {
//     type: { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number], index: '2dsphere' },
//   },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Worker', WorkerSchema);
const mongoose = require('mongoose');
const Request = require('./Request');
const Review = require('./Review');
const { deleteCloudinaryImages } = require('../utils/cloudinaryCleanup');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker'], default: 'worker' },
  phone: String,
  profilePhoto: String, // Cloudinary URL
  workerType: { type: String, required: true },
  experienceYears: { type: Number, default: 0 },
  solvedCount: { type: Number, default: 0 },

  availability: { type: Boolean, default: true }, // whether worker is available for work

  ratingAvg: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },

  // Each skill has a name and hourly rate
  skills: [
    {
      name: { type: String, required: true },
      hourlyRate: { type: Number, required: true },
    },
  ],

  address: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    tehsil: { type: String, required: true },
  },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' },
  },

  createdAt: { type: Date, default: Date.now },
});


// Cascade delete worker-related data
WorkerSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const workerId = this._id;

    // 1. Update requests: mark worker as deleted (but keep for users)
    await Request.updateMany(
      { worker: workerId },
      {
        $set: {
          workerName: 'Deleted Worker',
          worker: null,
        },
      }
    );

    // 2. Delete all reviews about this worker
    await Review.deleteMany({ worker: workerId });

    // 3. Delete worker's profile photo from Cloudinary
    if (this.profilePhoto) await deleteCloudinaryImages(this.profilePhoto);

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Worker', WorkerSchema);
