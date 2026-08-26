const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const Clinic = require('../models/Clinic');

async function assertOwnsClinic(userId, clinicId) {
  const clinic = await Clinic.findOne({ _id: clinicId, ownerId: userId });
  if (!clinic) throw new ApiError(403, 'You do not manage this clinic');
}

const addExpense = asyncHandler(async (req, res) => {
  await assertOwnsClinic(req.user.id, req.body.clinicId);
  const expense = await Expense.create(req.body);
  res.status(201).json(new ApiResponse(201, expense, 'Expense recorded'));
});

const listExpenses = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const expenses = await Expense.find({ clinicId: { $in: clinics.map((c) => c._id) } }).sort({ date: -1 });
  res.json(new ApiResponse(200, expenses));
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  await assertOwnsClinic(req.user.id, expense.clinicId);
  await expense.deleteOne();
  res.json(new ApiResponse(200, null, 'Expense removed'));
});

// Simple P&L: sum of paid invoices (revenue) minus sum of expenses.
const getSummary = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ ownerId: req.user.id }).select('_id');
  const clinicIds = clinics.map((c) => c._id);

  const [revenueAgg, expenseAgg] = await Promise.all([
    Invoice.aggregate([
      { $match: { clinicId: { $in: clinicIds }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Expense.aggregate([{ $match: { clinicId: { $in: clinicIds } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const expenses = expenseAgg[0]?.total || 0;

  res.json(new ApiResponse(200, { revenue, expenses, profit: revenue - expenses }));
});

module.exports = { addExpense, listExpenses, deleteExpense, getSummary };
