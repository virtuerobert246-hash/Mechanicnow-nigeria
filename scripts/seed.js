// Run once against your Atlas database to recreate the original demo
// records. Usage:  MONGODB_URI="your-atlas-uri" node scripts/seed.js
//
// IMPORTANT: these passwords are new ones, not the old committed
// 'password123'/'mechpass123' — those were exposed in your old public
// repo history and are treated as compromised.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Review = require('../models/Review');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  const userPassword = await bcrypt.hash('CHANGE_ME_123!', 10);
  const mechPassword = await bcrypt.hash('CHANGE_ME_456!', 10);

  const user1 = await User.create({
    id: 'user-001',
    name: 'Chukwuemeka Obi',
    phone: '08012345678',
    email: 'emeka@example.com',
    password: userPassword,
    role: 'user',
    createdAt: new Date('2024-01-15'),
  });

  const mechanicsData = [
    { id: 'mech-001', name: 'Emeka Auto Workshop', ownerName: 'Chukwuemeka Nwosu', phone: '08023456789', email: 'emeka.auto@example.com', address: '14 Bode Thomas Street, Surulere', state: 'Lagos', lga: 'Surulere', lat: 6.5006, lng: 3.3534, services: ['Engine Repair', 'Gearbox', 'Toyota Specialist'], specialties: ['Toyota', 'Honda', 'Hyundai'], rating: 4.9, reviewCount: 132, isOpen: true, openHours: '7:00 AM - 7:00 PM', openDays: 'Mon - Sat', isVerified: true, isAvailable: true, priceRange: '₦5,000 - ₦150,000', yearsExperience: 12, createdAt: new Date('2023-06-01') },
    { id: 'mech-002', name: 'Tunde Tyres & Auto', ownerName: 'Babatunde Adekunle', phone: '09034567890', email: 'tunde.tyres@example.com', address: '7 Western Avenue, Ojuelegba', state: 'Lagos', lga: 'Surulere', lat: 6.5091, lng: 3.3614, services: ['Vulcanizer', 'Tyre Change', 'Wheel Alignment', 'Brake Pads'], specialties: ['All vehicles'], rating: 4.3, reviewCount: 87, isOpen: true, openHours: '6:00 AM - 9:00 PM', openDays: 'Mon - Sun', isVerified: true, isAvailable: true, priceRange: '₦1,500 - ₦40,000', yearsExperience: 8, createdAt: new Date('2023-07-10') },
    { id: 'mech-003', name: 'Chidi Auto Electricals', ownerName: 'Chidubem Eze', phone: '08145678901', email: 'chidi.electricals@example.com', address: '22 Herbert Macaulay Way, Yaba', state: 'Lagos', lga: 'Yaba', lat: 6.5158, lng: 3.3742, services: ['Electricals', 'AC Repair', 'Battery', 'Wiring'], specialties: ['All vehicles', 'Electrical faults'], rating: 4.7, reviewCount: 204, isOpen: false, openHours: '8:00 AM - 6:00 PM', openDays: 'Mon - Fri', isVerified: true, isAvailable: false, priceRange: '₦3,000 - ₦80,000', yearsExperience: 15, createdAt: new Date('2023-05-15') },
    { id: 'mech-004', name: 'Abuja Motors & Repairs', ownerName: 'Musa Aliyu', phone: '08067890123', email: 'abuja.motors@example.com', address: '18 Aminu Kano Crescent, Wuse 2', state: 'Abuja', lga: 'Wuse', lat: 9.0579, lng: 7.4951, services: ['Engine Repair', 'Gearbox', 'Electricals', 'Oil Change'], specialties: ['Toyota', 'Mercedes', 'BMW'], rating: 4.8, reviewCount: 311, isOpen: true, openHours: '8:00 AM - 7:00 PM', openDays: 'Mon - Sat', isVerified: true, isAvailable: true, priceRange: '₦5,000 - ₦200,000', yearsExperience: 18, createdAt: new Date('2023-04-01') },
  ];

  for (const m of mechanicsData) {
    await Mechanic.create({ ...m, password: mechPassword, role: 'mechanic' });
  }

  await Review.create({
    id: 'rev-001',
    mechanicId: 'mech-001',
    userId: user1.id,
    userName: user1.name,
    rating: 5,
    comment: 'Emeka fixed my Camry engine in 2 hours. Very honest, no stories!',
    createdAt: new Date('2024-03-10'),
  });

  console.log('✅ Seed complete.');
  console.log('Demo user password: CHANGE_ME_123!');
  console.log('Demo mechanic password: CHANGE_ME_456!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
