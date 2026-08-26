const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const InventoryItem = require('../models/InventoryItem');
const Clinic = require('../models/Clinic');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const addItem = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  const item = await InventoryItem.create(req.body);
  res.status(201).json(new ApiResponse(201, item, 'Item added to inventory'));
});

const listItems = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const items = await InventoryItem.find({ clinicId: { $in: clinics.map((c) => c._id) } }).sort({ name: 1 });
  res.json(new ApiResponse(200, items));
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  await assertOwnsClinic(req.user.id, item.clinicId);

  Object.assign(item, req.body);
  await item.save();
  res.json(new ApiResponse(200, item, 'Item updated'));
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  await assertOwnsClinic(req.user.id, item.clinicId);
  await item.deleteOne();
  res.json(new ApiResponse(200, null, 'Item deleted'));
});

module.exports = { addItem, listItems, updateItem, deleteItem };
