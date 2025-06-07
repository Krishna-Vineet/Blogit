import multer from 'multer';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/temp'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Prefix with a timestamp to avoid name collisions
  }
});

// Initialize multer with storage configuration
export const upload = multer({ storage: storage });
