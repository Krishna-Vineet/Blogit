import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Function to upload a file to Cloudinary. It supports both local file paths and remote URLs.
 * @param {string} filePathOrUrl - Local file path or remote URL.
 * @returns {Promise<object|null>} - Response from Cloudinary or null on failure.
 */
const uploadOnCloudinary = async (filePathOrUrl) => {
  try {
    if (!filePathOrUrl) return null;

    // Determine if the input is a URL or a local file path
    const isUrl = filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://');

    // If it's a URL, directly upload from the URL
    const response = await cloudinary.uploader.upload(filePathOrUrl, {
      resource_type: "auto" // Automatically determine the resource type (image, video, etc.)
    });

    // If it's a local file path, delete the local file after upload
    if (!isUrl) {
      fs.unlinkSync(filePathOrUrl); // Remove the locally saved temporary file as the upload operation got success
    }
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // If it's a local file path, delete the local file after upload failure
    if (!filePathOrUrl.startsWith('http://') && !filePathOrUrl.startsWith('https://')) {
      fs.unlinkSync(filePathOrUrl); // Remove the locally saved temporary file as the upload operation got failed
    }

    return null;
  }
};

/**
 * Function to delete a file from Cloudinary.
 * @param {string} cloudinaryURL - URL of the file in Cloudinary.
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (cloudinaryURL) => {
  try {
    // Remove the protocol (https://) and split the URL by '/'
    const parts = cloudinaryURL.replace(/^https?:\/\//, '').split('/');
    // Find the index of the 'upload' part (or 'fetch' for fetched images)
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    // The public_id is after the version number, which is one position after 'upload'
    const publicIdWithVersion = parts.slice(uploadIndex + 2).join('/');
    // Remove the file extension from the public_id
    const publicId = publicIdWithVersion.substring(0, publicIdWithVersion.lastIndexOf('.'));

    // Delete the file from Cloudinary
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
