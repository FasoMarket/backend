const mongoose = require('mongoose');
const AdminSettings = require('./src/models/AdminSettings');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fasomarket');
    console.log('Connected to DB');
    let settings = await AdminSettings.findOne({ singleton: true });
    if (!settings) {
       console.log('Not found, creating...');
       settings = await AdminSettings.create({ singleton: true });
    }
    console.log('Success:', settings);
  } catch(e) {
    console.log('Error thrown:', e.message);
  }
  process.exit(0);
}
test();
