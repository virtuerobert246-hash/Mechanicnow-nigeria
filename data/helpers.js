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

// Accepts either a Mongoose document or a plain object and strips
// internal/sensitive fields before sending to the client.
function sanitizeMechanic(mech, userLat = null, userLng = null) {
  const obj = typeof mech.toObject === 'function' ? mech.toObject() : { ...mech };
  delete obj.password;
  delete obj._id;
  delete obj.__v;

  if (userLat !== null && userLng !== null) {
    obj.distanceKm = parseFloat(
      getDistanceKm(userLat, userLng, obj.lat, obj.lng).toFixed(2)
    );
  }
  return obj;
}

function sanitizeUser(user) {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj._id;
  delete obj.__v;
  return obj;
}

module.exports = { getDistanceKm, sanitizeMechanic, sanitizeUser };
