const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { emitToUser } = require('../services/socketService');

// Chat is only allowed between a patient and doctor who actually share an
// appointment — prevents patients messaging arbitrary doctors, and vice versa.
async function assertRelationshipExists(userAId, userBId) {
  const patient = await Patient.findOne({ userId: userAId });
  const doctor = await Doctor.findOne({ userId: userBId });
  if (patient && doctor) {
    const exists = await Appointment.exists({ patientId: patient._id, doctorId: doctor._id });
    if (exists) return true;
  }
  // try the reverse (userA might be the doctor, userB the patient)
  const patient2 = await Patient.findOne({ userId: userBId });
  const doctor2 = await Doctor.findOne({ userId: userAId });
  if (patient2 && doctor2) {
    const exists2 = await Appointment.exists({ patientId: patient2._id, doctorId: doctor2._id });
    if (exists2) return true;
  }
  return false;
}

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, appointmentId, text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Message text is required');

  const allowed = await assertRelationshipExists(req.user.id, receiverId);
  if (!allowed) throw new ApiError(403, 'You can only message a doctor/patient you have an appointment with');

  const message = await Message.create({ senderId: req.user.id, receiverId, appointmentId, text });

  emitToUser(receiverId, 'message:new', {
    _id: message._id,
    senderId: req.user.id,
    text: message.text,
    createdAt: message.createdAt,
  });

  res.status(201).json(new ApiResponse(201, message, 'Message sent'));
});

// All messages between the current user and one other user, oldest first.
const getThread = asyncHandler(async (req, res) => {
  const otherUserId = req.params.otherUserId;
  const messages = await Message.find({
    $or: [
      { senderId: req.user.id, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: req.user.id },
    ],
  }).sort({ createdAt: 1 });

  res.json(new ApiResponse(200, messages));
});

// Inbox view: one row per conversation partner with the latest message.
const getConversations = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const conversations = await Message.aggregate([
    { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
        },
        lastMessage: { $first: '$text' },
        lastAt: { $first: '$createdAt' },
      },
    },
    { $sort: { lastAt: -1 } },
  ]);

  const User = require('../models/User');
  const populated = await Promise.all(
    conversations.map(async (c) => {
      const user = await User.findById(c._id).select('name role');
      return { userId: c._id, name: user?.name, role: user?.role, lastMessage: c.lastMessage, lastAt: c.lastAt };
    })
  );

  res.json(new ApiResponse(200, populated));
});

module.exports = { sendMessage, getThread, getConversations };
