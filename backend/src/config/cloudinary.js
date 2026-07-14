const cloudinary = require('cloudinary').v2
const fs = require('fs')

// Configure Cloudinary credentials using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file
 * @param {string} localFilePath - Absolute/relative path to the local file
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<Object|null>} - Returns Cloudinary response object if successful, null if credentials not set
 */
const uploadToCloudinary = async (localFilePath, folder = 'social_media_app') => {
  try {
    if (!localFilePath) return null

    // Check if Cloudinary is configured
    const isConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET

    if (!isConfigured) {
      console.warn('Cloudinary credentials not set. Falling back to local storage.')
      return null
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder:        `social_media_app/${folder}`,
      resource_type: 'auto', // Auto-detect image vs video vs other
    })

    // Clean up/delete local temp file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }

    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    // Clean up local temp file on error too to prevent disk clutter
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath)
      } catch (err) {
        console.error('Failed to delete temp file:', err)
      }
    }
    throw error
  }
}

module.exports = { cloudinary, uploadToCloudinary }
