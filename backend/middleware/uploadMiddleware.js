const { upload } = require('../config/cloudinary');

/**
 * Middleware: uploadSingle
 * Handles a single file upload via the "attachment" form field.
 * The file is streamed directly to Cloudinary — nothing touches the server disk.
 * multer-storage-cloudinary populates req.file with the Cloudinary response.
 */
const uploadSingle = upload.single('attachment');

module.exports = { uploadSingle };
