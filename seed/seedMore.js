// Additive seed script — adds a larger roster of doctors and patients for
// manual testing (search/filter, booking clashes, dynamic pricing, family
// members, etc.) WITHOUT touching any existing data. Unlike seed.js, this
// script never deletes anything — safe to run against a database that
// already has real bookings/history in it.
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Doctor = require('../src/models/Doctor');
const Clinic = require('../src/models/Clinic');
const Specialization = require('../src/models/Specialization');

const PASSWORD = 'password123';

async function ensureUser({ name, email, role }) {
  const existing = await User.findOne({ email });
  if (existing) return { user: existing, created: false };
  const passwordHash = await User.hashPassword(PASSWORD);
  const user = await User.create({ name, email, passwordHash, role });
  return { user, created: true };
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('[seedMore] connected');

  // --- Second admin + branch, so cross-branch access control (IDOR fixes)
  // can actually be exercised manually: admin2 should NOT be able to touch
  // admin1's branch data, and vice versa. Same clinic brand (ABC Hospital),
  // different branch/city — this app models one hospital chain with
  // multiple branches, not unrelated multi-tenant clinics.
  const { user: admin2 } = await ensureUser({ name: 'ABC Hospital (Dhaka) Admin', email: 'admin2@clinic.com', role: 'admin' });
  let clinic2 = await Clinic.findOne({ ownerId: admin2._id });
  if (!clinic2) {
    clinic2 = await Clinic.create({
      name: 'ABC Hospital - Dhaka',
      address: 'Gulshan Avenue',
      city: 'Dhaka',
      location: { lat: 23.7925, lng: 90.4078 },
      ownerId: admin2._id,
      contactNumber: '01800000000',
    });
  }

  let clinic1 = await Clinic.findOne().sort({ createdAt: 1 }); // first/original branch (from seed.js)
  if (clinic1 && clinic1.name === 'ABC Hospital') {
    clinic1.name = `ABC Hospital - ${clinic1.city}`;
    await clinic1.save();
  }

  const specs = await Specialization.find();
  const specByName = Object.fromEntries(specs.map((s) => [s.name, s._id]));

  const doctorRoster = [
    { email: 'doctor3@clinic.com', name: 'Dr. Nusrat Jahan', spec: 'Neurologist', clinic: clinic1, fee: 900, peak: 1200, exp: 8 },
    { email: 'doctor4@clinic.com', name: 'Dr. Kamal Hossain', spec: 'Cardiologist', clinic: clinic2, fee: 1200, peak: 1500, exp: 14 },
    { email: 'doctor5@clinic.com', name: 'Dr. Farhana Akter', spec: 'Orthopedic', clinic: clinic2, fee: 800, peak: null, exp: 6 },
    { email: 'doctor6@clinic.com', name: 'Dr. Shamim Reza', spec: 'Dentist', clinic: clinic1, fee: 500, peak: 700, exp: 5 },
    { email: 'doctor7@clinic.com', name: 'Dr. Tania Sultana', spec: 'ENT', clinic: clinic2, fee: 700, peak: null, exp: 9 },
    { email: 'doctor8@clinic.com', name: 'Dr. Mahbubur Rahman', spec: 'Gynecologist', clinic: clinic1, fee: 1000, peak: 1300, exp: 12 },
    { email: 'doctor9@clinic.com', name: 'Dr. Rummana Chowdhury', spec: 'Gynecologist', clinic: clinic2, fee: 950, peak: null, exp: 7 },
    { email: 'doctor10@clinic.com', name: 'Dr. Imran Kabir', spec: 'Dermatologist', clinic: clinic1, fee: 650, peak: 850, exp: 4 },
    { email: 'doctor11@clinic.com', name: 'Dr. Sadia Islam', spec: 'Cardiologist', clinic: clinic1, fee: 1100, peak: null, exp: 11 },
    { email: 'doctor12@clinic.com', name: 'Dr. Zahidul Islam', spec: 'Orthopedic', clinic: clinic1, fee: 750, peak: 950, exp: 10 },
  ];

  for (const d of doctorRoster) {
    const { user, created } = await ensureUser({ name: d.name, email: d.email, role: 'doctor' });
    const existingDoctor = await Doctor.findOne({ userId: user._id });
    if (existingDoctor) {
      console.log(`[seedMore] doctor already exists, skipping: ${d.email}`);
      continue;
    }
    await Doctor.create({
      userId: user._id,
      specializationId: specByName[d.spec],
      clinicIds: [d.clinic._id],
      experienceYears: d.exp,
      consultationFee: d.fee,
      peakHourFee: d.peak,
      bio: `${d.spec} at ${d.clinic.name}, ${d.exp} years of experience.`,
      availability: [{ day: 'sat', startTime: '09:00', endTime: '13:00' }],
      approvalStatus: 'approved', // seeded doctors are pre-approved
    });
    console.log(`[seedMore] created doctor: ${d.email} (${d.spec}, ${d.clinic.name})`);
  }

  const patientRoster = [
    { email: 'patient2@clinic.com', name: 'Fatema Begum', age: 34, gender: 'female', bloodGroup: 'A+', address: 'Mirpur, Dhaka' },
    { email: 'patient3@clinic.com', name: 'Abdul Karim', age: 58, gender: 'male', bloodGroup: 'B+', address: 'Dhanmondi, Dhaka' },
    { email: 'patient4@clinic.com', name: 'Nasrin Sultana', age: 27, gender: 'female', bloodGroup: 'O-', address: 'Boalia, Rajshahi' },
    { email: 'patient5@clinic.com', name: 'Jahangir Alam', age: 41, gender: 'male', bloodGroup: 'AB+', address: 'Kotwali, Dinajpur' },
    { email: 'patient6@clinic.com', name: 'Rina Akter', age: 22, gender: 'female', bloodGroup: 'A-', address: 'Uttara, Dhaka' },
    { email: 'patient7@clinic.com', name: 'Shahidul Islam', age: 65, gender: 'male', bloodGroup: 'O+', address: 'Bogura Sadar, Bogura' },
    { email: 'patient8@clinic.com', name: 'Mousumi Rahman', age: 30, gender: 'female', bloodGroup: 'B-', address: 'Panchagarh Sadar, Panchagarh' },
    { email: 'patient9@clinic.com', name: 'Rafiqul Islam', age: 48, gender: 'male', bloodGroup: 'AB-', address: 'Gulshan, Dhaka' },
  ];

  for (const p of patientRoster) {
    const { user } = await ensureUser({ name: p.name, email: p.email, role: 'patient' });
    const existingPatient = await Patient.findOne({ userId: user._id });
    if (existingPatient) {
      console.log(`[seedMore] patient already exists, skipping: ${p.email}`);
      continue;
    }
    await Patient.create({
      userId: user._id,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      address: p.address,
      emergencyContact: '017' + String(Math.floor(10000000 + Math.random() * 89999999)),
    });
    console.log(`[seedMore] created patient: ${p.email}`);
  }

  console.log('\n[seedMore] Done. All new accounts use password: password123');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
