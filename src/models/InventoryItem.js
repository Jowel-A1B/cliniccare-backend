const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'pcs' }, // pcs, box, bottle...
    reorderLevel: { type: Number, default: 10 }, // UI can flag "low stock" below this
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
