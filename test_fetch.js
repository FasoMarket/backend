const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
  await mongoose.connect('mongodb://localhost:27017/fasomarket');
  const User = mongoose.model('User', new mongoose.Schema({ role: String, email: String, isVendorApproved: Boolean }));
  
  // Find admin
  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
    try {
      console.log('Fetching /api/settings/admin...');
      const res = await fetch('http://localhost:5000/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      console.log('ADMIN SETTINGS STATUS:', res.status, data);
    } catch(e) {
      console.log('ADMIN SETTINGS FETCH ERROR:', e.message);
    }
  } else {
    console.log('No admin found');
  }

  process.exit(0);
}
run();
