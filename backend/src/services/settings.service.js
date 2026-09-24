const Setting = require('../models/Setting');
exports.getSettings = async () => (await Setting.findOne()) || Setting.create({});
exports.updateSettings = async (patch) => { const s = await exports.getSettings(); Object.assign(s, patch); return s.save(); };
