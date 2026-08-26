const mongoose = require('mongoose');

// Directory-style staff record (not a login account). Extending this to a
// real staff login with its own RBAC role is a natural V5 step — see the
// comment on utils/constants.js ROLES for where that would slot in.
const staffSchema = new mongoose.Schema(
  {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['nurse', 'receptionist', 'accountant', 'lab_technician'], required: true },
    phone: String,
    email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
