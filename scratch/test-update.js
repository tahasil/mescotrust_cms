const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const PushNotificationSettings = require('../models/PushNotificationSettings');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const updateData = {
    cardTitle: 'Notifications',
    cardDescription: 'Stay connected...',
    enableButtonText: 'Enable Alerts',
    dismissButtonText: 'Not Now',
    enabled: true,
    showBellIcon: false,
    updatedBy: 'admin',
  };
  const settings = await PushNotificationSettings.findOneAndUpdate(
    { moduleName: 'push-settings' },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Result settings.showBellIcon:', settings.showBellIcon);
  const found = await PushNotificationSettings.findOne({ moduleName: 'push-settings' }).lean();
  console.log('Found in DB showBellIcon:', found.showBellIcon);
  await mongoose.disconnect();
}

test();
