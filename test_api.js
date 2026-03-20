const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
  await mongoose.connect('mongodb://localhost:27017/fasomarket');
  const User = mongoose.model('User', new mongoose.Schema({ role: String, email: String, isVendorApproved: Boolean }));
  
  // Find admin
  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
    try {
      const res = await axios.get('http://localhost:5000/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('ADMIN SETTINGS SUCCESS:', res.data);
    } catch(e) {
      console.log('ADMIN SETTINGS ERROR:', e.response?.data || e.message);
    }
  } else {
    console.log('No admin found');
  }

  // Find vendor
  const vendor = await User.findOne({ role: 'vendor' });
  if (vendor) {
    const vendorToken = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
    try {
      const res = await axios.get('http://localhost:5000/api/vendor/stats', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      console.log('VENDOR STATS SUCCESS:', res.data);
    } catch(e) {
      console.log('VENDOR STATS ERROR:', e.response?.data || e.message);
      if (e.response?.status === 403) {
        console.log('Vendor Approval Status in DB:', vendor.isVendorApproved);
      }
    }
  } else {
    console.log('No vendor found');
  }

  process.exit(0);
}
run();
