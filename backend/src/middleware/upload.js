// Local disk storage. To move to cloud storage, replace `storage` with a multer storage engine (e.g. S3)
// and swap removeFiles/serve logic in message.service.
const multer = require('multer'), path = require('path'), fs = require('fs'), crypto = require('crypto');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ALLOWED = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/msword': ['.doc'], [DOCX]: ['.docx'] };
const MAGIC = { 'application/pdf': [0x25, 0x50, 0x44, 0x46], 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'application/msword': [0xd0, 0xcf, 0x11, 0xe0], [DOCX]: [0x50, 0x4b, 0x03, 0x04] };
fs.mkdirSync(env.uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: env.uploadDir, filename: (req, f, cb) => cb(null, crypto.randomBytes(16).toString('hex') + path.extname(f.originalname).toLowerCase()) });
const uploader = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 5 }, fileFilter: (req, f, cb) => {
  const exts = ALLOWED[f.mimetype];
  if (!exts || !exts.includes(path.extname(f.originalname).toLowerCase())) return cb(new AppError(422, `${f.originalname}: only PDF, JPG, PNG, DOC and DOCX files are allowed`));
  cb(null, true);
} });
const removeFiles = (files = []) => files.forEach((f) => fs.unlink(f.path, () => {}));
const uploadFiles = (field = 'attachments') => (req, res, next) => uploader.array(field, 5)(req, res, (err) => {
  if (err) { removeFiles(req.files); return next(err); }
  try {
    for (const f of req.files || []) {
      const b = Buffer.alloc(8); const fd = fs.openSync(f.path, 'r'); fs.readSync(fd, b, 0, 8, 0); fs.closeSync(fd);
      if (!MAGIC[f.mimetype].every((x, i) => b[i] === x)) throw new AppError(422, `${f.originalname}: file content does not match its type`);
    }
    next();
  } catch (e) { removeFiles(req.files); next(e); }
});
module.exports = { uploadFiles, removeFiles };
