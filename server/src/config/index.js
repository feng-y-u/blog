const path = require('path')

require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Resolve to an absolute path so multer and express.static agree regardless of cwd.
  uploadDir: path.resolve(__dirname, '../..', process.env.UPLOAD_DIR || 'uploads'),
  maxFileSize: 5 * 1024 * 1024,
}
