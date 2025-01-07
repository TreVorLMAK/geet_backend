const multer = require('multer');

// Set up storage engine for multer (e.g., saving files to a folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const multerUpload = multer({ storage });

module.exports = { storage, multerUpload };
