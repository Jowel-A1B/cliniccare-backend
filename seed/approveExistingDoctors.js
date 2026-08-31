// One-time migration.
//
// Doctors created before the approval workflow existed have no
// `approvalStatus` stored. Mongoose hydrates those documents with the schema
// default ('pending'), which makes login reject them ("awaiting admin
// approval"). Those doctors predate the feature and were already live, so
// mark them 'approved' and make sure their User account is active.
//
// Safe to re-run — it only touches doctors missing an explicit status.
// Run from backend/:  node seed/approveExistingDoctors.js   (or: npm run migrate:doctors)

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Doctor = require('../src/models/Doctor');
const User = require('../src/models/User');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('[migrate] connected');

  const res = await Doctor.updateMany(
    { $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: null }] },
    { $set: { approvalStatus: 'approved' } }
  );
  console.log(`[migrate] pre-existing doctors set to approved: ${res.modifiedCount}`);

  // Reactivate the User accounts of approved doctors that are still inactive
  // (register() creates doctor users inactive; a genuinely pending/rejected
  // new doctor is NOT approved, so this leaves those alone).
  const approved = await Doctor.find({ approvalStatus: 'approved' }).select('userId');
  const ures = await User.updateMany(
    { _id: { $in: approved.map((d) => d.userId) }, isActive: false },
    { $set: { isActive: true } }
  );
  console.log(`[migrate] doctor user accounts reactivated: ${ures.modifiedCount}`);

  await mongoose.disconnect();
  console.log('[migrate] done');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
