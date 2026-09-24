const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');
module.exports = async () => {
	mongoose.set('strictQuery', true);
	if (env.mongoDnsServers.length) dns.setServers(env.mongoDnsServers);
	await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
	console.log('MongoDB connected');
};
