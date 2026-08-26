const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    category: { type: String, required: true }, // "Salaries", "Medicine Purchase", "Utilities"...
    description: String,
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
