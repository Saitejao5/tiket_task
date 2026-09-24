const express = require('express'), helmet = require('helmet'), cors = require('cors');
const env = require('./config/env');
const AppError = require('./utils/AppError');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
	origin: (origin, callback) => {
		if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
		return callback(new AppError(403, 'Origin is not allowed', 'CORS_NOT_ALLOWED'));
	},
	credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/files', require('./routes/message.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/sla-policies', require('./routes/sla.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api', require('./routes/audit.routes'));
app.use(notFound);
app.use(errorHandler);
module.exports = app;
