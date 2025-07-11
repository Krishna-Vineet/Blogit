// import multer from 'multer';
// import fs from 'fs';

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = 'public/temp';   // Make sure this directory exists
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname); // Prefix with a timestamp to avoid name collisions
//   }
// });

// // Initialize multer with storage configuration
// export const upload = multer({ storage: storage });


import multer from 'multer';

// Multer memory storage (in-memory buffer, no disk usage)
const storage = multer.memoryStorage();

export const upload = multer({ storage });
