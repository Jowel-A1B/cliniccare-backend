const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const CommunityPost = require('../models/CommunityPost');
const Doctor = require('../models/Doctor');

const createPost = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const post = await CommunityPost.create({ doctorId: doctor._id, title: req.body.title, content: req.body.content });
  res.status(201).json(new ApiResponse(201, post, 'Post published'));
});

const listPosts = asyncHandler(async (req, res) => {
  const posts = await CommunityPost.find()
    .populate({ path: 'doctorId', populate: [{ path: 'userId', select: 'name' }, { path: 'specializationId', select: 'name' }] })
    .populate({ path: 'comments.doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(new ApiResponse(200, posts));
});

const addComment = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');

  post.comments.push({ doctorId: doctor._id, content: req.body.content });
  await post.save();

  const updated = await CommunityPost.findById(post._id).populate({
    path: 'comments.doctorId',
    populate: { path: 'userId', select: 'name' },
  });
  res.status(201).json(new ApiResponse(201, updated, 'Comment added'));
});

module.exports = { createPost, listPosts, addComment };
