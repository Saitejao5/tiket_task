const { Schema, model } = require('mongoose');
module.exports = model('Setting', new Schema({ reopenWindowDays: { type: Number, default: 7 }, dueSoonPercent: { type: Number, default: 25 }, pendingAlertThreshold: { type: Number, default: 10 } }, { timestamps: true }));
