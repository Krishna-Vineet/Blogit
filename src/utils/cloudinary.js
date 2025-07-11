// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// /**
//  * Function to upload a file to Cloudinary. It supports both local file paths and remote URLs.
//  * @param {string} filePathOrUrl - Local file path or remote URL.
//  * @returns {Promise<object|null>} - Response from Cloudinary or null on failure.
//  */
// const uploadOnCloudinary = async (filePathOrUrl) => {
//   try {
//     if (!filePathOrUrl) return null;

//     // Determine if the input is a URL or a local file path
//     const isUrl = filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://');

//     // If it's a URL, directly upload from the URL
//     const response = await cloudinary.uploader.upload(filePathOrUrl, {
//       resource_type: "auto" // Automatically determine the resource type (image, video, etc.)
//     });

//     // If it's a local file path, delete the local file after upload
//     if (!isUrl) {
//       fs.unlinkSync(filePathOrUrl); // Remove the locally saved temporary file as the upload operation got success
//     }
//     return response;
//   } catch (error) {
//     console.error("Error uploading to Cloudinary:", error);

//     // If it's a local file path, delete the local file after upload failure
//     if (!filePathOrUrl.startsWith('http://') && !filePathOrUrl.startsWith('https://')) {
//       fs.unlinkSync(filePathOrUrl); // Remove the locally saved temporary file as the upload operation got failed
//     }

//     return null;
//   }
// };

// /**
//  * Function to delete a file from Cloudinary.
//  * @param {string} cloudinaryURL - URL of the file in Cloudinary.
//  * @returns {Promise<void>}
//  */
// const deleteFromCloudinary = async (cloudinaryURL) => {
//   try {
//     // Remove the protocol (https://) and split the URL by '/'
//     const parts = cloudinaryURL.replace(/^https?:\/\//, '').split('/');
//     // Find the index of the 'upload' part (or 'fetch' for fetched images)
//     const uploadIndex = parts.indexOf('upload');
//     if (uploadIndex === -1) {
//       throw new Error('Invalid Cloudinary URL');
//     }
//     // The public_id is after the version number, which is one position after 'upload'
//     const publicIdWithVersion = parts.slice(uploadIndex + 2).join('/');
//     // Remove the file extension from the public_id
//     const publicId = publicIdWithVersion.substring(0, publicIdWithVersion.lastIndexOf('.'));

//     // Delete the file from Cloudinary
//     await cloudinary.uploader.destroy(publicId);
//   } catch (error) {
//     console.error('Error deleting from Cloudinary:', error);
//   }
// };

// export { uploadOnCloudinary, deleteFromCloudinary };









import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - The in-memory file buffer from multer
 * @param {string} fileName - Original filename (for naming in Cloudinary)
 * @returns {Promise<object|null>}
 */
const uploadOnCloudinary = (fileBuffer, fileName = "file") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "blogs",
        public_id: `${Date.now()}-${fileName}`,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary given its URL
 * @param {string} cloudinaryURL
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (cloudinaryURL) => {
  try {
    const parts = cloudinaryURL.replace(/^https?:\/\//, '').split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL');

    const publicIdWithVersion = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithVersion.substring(0, publicIdWithVersion.lastIndexOf('.'));

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
