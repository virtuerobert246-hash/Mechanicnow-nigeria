const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const mechanicSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: null },
  password: { type: String, required: true },
  role: { type: String, default: 'mechanic' },
  address: { type: String, required: true },
  state: { type: String, required: true },
  lga: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  services: { type: [String], default: [] },
  specialties: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: false },
  openHours: { type: String, default: '8:00 AM - 6:00 PM' },
  openDays: { type: String, default: 'Mon - Sat' },
  profileImage: { type: String, default: null },
  workshopImages: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  priceRange: { type: String, default: null },
  yearsExperience: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Mechanic', mechanicSchema);
