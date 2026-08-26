// Seeds a minimal but complete dataset so V1 can be demoed immediately:
// 1 admin (clinic owner), 1 clinic, specializations, 2 doctors, 1 patient.
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Doctor = require('../src/models/Doctor');
const Clinic = require('../src/models/Clinic');
const Specialization = require('../src/models/Specialization');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('[seed] connected');

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Clinic.deleteMany({}),
    Specialization.deleteMany({}),
  ]);

  const specNames = ['Cardiologist', 'Neurologist', 'Orthopedic', 'ENT', 'Dermatologist', 'Dentist', 'Gynecologist'];
  const specs = await Specialization.insertMany(specNames.map((name) => ({ name })));

  const passwordHash = await User.hashPassword('password123');

  const adminUser = await User.create({
    name: 'Clinic Admin',
    email: 'admin@clinic.com',
    passwordHash,
    role: 'admin',
  });

  const clinic = await Clinic.create({
    name: 'ABC Hospital',
    address: 'Station Road',
    city: 'Dinajpur',
    location: { lat: 25.6279, lng: 88.6332 },
    ownerId: adminUser._id,
    contactNumber: '01700000000',
  });

  const doctorUser1 = await User.create({
    name: 'Dr. Hasan',
    email: 'doctor1@clinic.com',
    passwordHash,
    role: 'doctor',
  });
  const doctor1 = await Doctor.create({
    userId: doctorUser1._id,
    specializationId: specs[0]._id, // Cardiologist
    clinicIds: [clinic._id],
    experienceYears: 10,
    consultationFee: 800,
    bio: 'Senior cardiologist with 10 years of experience.',
    availability: [{ day: 'sat', startTime: '17:00', endTime: '20:00' }],
  });

  const doctorUser2 = await User.create({
    name: 'Dr. Rahman',
    email: 'doctor2@clinic.com',
    passwordHash,
    role: 'doctor',
  });
  const doctor2 = await Doctor.create({
    userId: doctorUser2._id,
    specializationId: specs[2]._id, // Orthopedic
    clinicIds: [clinic._id],
    experienceYears: 15,
    consultationFee: 1000,
    bio: 'Orthopedic surgeon specializing in joint pain.',
    availability: [{ day: 'sun', startTime: '10:00', endTime: '13:00' }],
  });

  const patientUser = await User.create({
    name: 'Rahim Ahmed',
    email: 'patient@clinic.com',
    passwordHash,
    role: 'patient',
  });
  await Patient.create({
    userId: patientUser._id,
    age: 45,
    gender: 'male',
    bloodGroup: 'O+',
    address: 'Dinajpur, Bangladesh',
    emergencyContact: '01711111111',
  });

  console.log('[seed] Done. Login with password "password123" for:');
  console.log('  admin@clinic.com (admin)');
  console.log('  doctor1@clinic.com / doctor2@clinic.com (doctor)');
  console.log('  patient@clinic.com (patient)');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
