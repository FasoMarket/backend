const mongoose = require('mongoose');
const User = require('./src/models/User');

async function approve() {
  await mongoose.connect('mongodb://localhost:27017/fasomarket');
  const res = await User.updateMany({ role: 'vendor' }, { $set: { isVendorApproved: true } });
  console.log('Approved vendors:', res.modifiedCount);
  process.exit(0);
}
approve();
