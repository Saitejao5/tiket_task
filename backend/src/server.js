const env = require('./config/env');
const connect = require('./config/db');
const app = require('./app');
const sla = require('./services/sla.service');
const mongoose = require('mongoose');

let server;
let slaTimer;
let shuttingDown = false;

async function start() {
	await connect();
	slaTimer = sla.start();
	server = app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
}

async function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`${signal} received, shutting down`);
	if (slaTimer) clearInterval(slaTimer);
	if (server) await new Promise((resolve) => server.close(resolve));
	await mongoose.disconnect();
}

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, () => shutdown(signal).then(() => process.exit(0)).catch(() => process.exit(1)));
}

start().catch((e) => {
	console.error('Startup failed:', e.message);
	process.exitCode = 1;
});
 