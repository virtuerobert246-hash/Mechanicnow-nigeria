const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const users = [
  {
    id: 'user-001',
    name: 'Chukwuemeka Obi',
    phone: '08012345678',
    email: 'emeka@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    createdAt: new Date('2024-01-15'),
  },
];

const mechanics = [
  {
    id: 'mech-001',
    name: 'Emeka Auto Workshop',
    ownerName: 'Chukwuemeka Nwosu',
    phone: '08023456789',
    email: 'emeka.auto@example.com',
    password: bcrypt.hashSync('mechpass123', 10),
    role: 'mechanic',
    address: '14 Bode Thomas Street, Surulere',
    state: 'Lagos',
    lga: 'Surulere',
    lat: 6.5006,
    lng: 3.3534,
    services: ['Engine Repair', 'Gearbox', 'Toyota Specialist'],
    specialties: ['Toyota', 'Honda', 'Hyundai'],
    rating: 4.9,
    reviewCount: 132,
    isOpen: true,
    openHours: '7:00 AM - 7:00 PM',
    openDays: 'Mon - Sat',
    profileImage: null,
    workshopImages: [],
    isVerified: true,
    isAvailable: true,
    priceRange: '₦5,000 - ₦150,000',
    yearsExperience: 12,
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'mech-002',
    name: 'Tunde Tyres & Auto',
    ownerName: 'Babatunde Adekunle',
    phone: '09034567890',
    email: 'tunde.tyres@example.com',
    password: bcrypt.hashSync('mechpass123', 10),
    role: 'mechanic',
    address: '7 Western Avenue, Ojuelegba',
    state: 'Lagos',
    lga: 'Surulere',
    lat: 6.5091,
    lng: 3.3614,
    services: ['Vulcanizer', 'Tyre Change', 'Wheel Alignment', 'Brake Pads'],
    specialties: ['All vehicles'],
    rating: 4.3,
    reviewCount: 87,
    isOpen: true,
    openHours: '6:00 AM - 9:00 PM',
    openDays: 'Mon - Sun',
    profileImage: null,
    workshopImages: [],
    isVerified: true,
    isAvailable: true,
    priceRange: '₦1,500 - ₦40,000',
    yearsExperience: 8,
    createdAt: new Date('2023-07-10'),
  },
  {
    id: 'mech-003',
    name: 'Chidi Auto Electricals',
    ownerName: 'Chidubem Eze',
    phone: '08145678901',
    email: 'chidi.electricals@example.com',
    password: bcrypt.hashSync('mechpass123', 10),
    role: 'mechanic',
    address: '22 Herbert Macaulay Way, Yaba',
    state: 'Lagos',
    lga: 'Yaba',
    lat: 6.5158,
    lng: 3.3742,
    services: ['Electricals', 'AC Repair', 'Battery', 'Wiring'],
    specialties: ['All vehicles', 'Electrical faults'],
    rating: 4.7,
    reviewCount: 204,
    isOpen: false,
    openHours: '8:00 AM - 6:00 PM',
    openDays: 'Mon - Fri',
    profileImage: null,
    workshopImages: [],
    isVerified: true,
    isAvailable: false,
    priceRange: '₦3,000 - ₦80,000',
    yearsExperience: 15,
    createdAt: new Date('2023-05-15'),
  },
  {
    id: 'mech-004',
    name: 'Abuja Motors & Repairs',
    ownerName: 'Musa Aliyu',
    phone: '08067890123',
    email: 'abuja.motors@example.com',
    password: bcrypt.hashSync('mechpass123', 10),
    role: 'mechanic',
    address: '18 Aminu Kano Crescent, Wuse 2',
    state: 'Abuja',
    lga: 'Wuse',
    lat: 9.0579,
    lng: 7.4951,
    services: ['Engine Repair', 'Gearbox', 'Electricals', 'Oil Change'],
    specialties: ['Toyota', 'Mercedes', 'BMW'],
    rating: 4.8,
    reviewCount: 311,
    isOpen: true,
    openHours: '8:00 AM - 7:00 PM',
    openDays: 'Mon - Sat',
    profileImage: null,
    workshopImages: [],
    isVerified: true,
    isAvailable: true,
    priceRange: '₦5,000 - ₦200,000',
    yearsExperience: 18,
    createdAt: new Date('2023-04-01'),
  },
];

const reviews = [
  {
    id: 'rev-001',
    mechanicId: 'mech-001',
    userId: 'user-001',
    userName: 'Chukwuemeka Obi',
    rating: 5,
    comment: 'Emeka fixed my Camry engine in 2 hours. Very honest, no stories!',
    createdAt: new Date('2024-03-10'),
  },
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sanitizeMechanic(mech, userLat = null, userLng = null) {
  const { password, ...safe } = mech;
  if (userLat !== null && userLng !== null) {
    safe.distanceKm = parseFloat(
      getDistanceKm(userLat, userLng, mech.lat, mech.lng).toFixed(2)
    );
  }
  return safe;
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = {
  users,
  mechanics,
  reviews,
  uuidv4,
  getDistanceKm,
  sanitizeMechanic,
  sanitizeUser,
};
