const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Doctor-only space for case discussion / knowledge sharing.
const communityPostSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityPost', communityPostSchema);
