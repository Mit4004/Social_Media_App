const User = require('../models/User')
const Post = require('../models/Post')
const { uploadToCloudinary } = require('../config/cloudinary')

// Uploads a new profile photo for the authenticated user
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    let photoUrl = `/uploads/profiles/${req.file.filename}`
    let storageType = 'local'

    // Attempt to upload to Cloudinary
    try {
      const cloudinaryResult = await uploadToCloudinary(req.file.path, 'profiles')
      if (cloudinaryResult) {
        photoUrl = cloudinaryResult.secure_url
        storageType = 'cloudinary'
      }
    } catch (err) {
      console.error('Cloudinary profile photo upload error, using local fallback:', err)
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          profilePhoto: {
            url:         photoUrl,
            storageType: storageType,
          },
        },
      },
      { new: true }
    ).select('-password')

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Uploads media files attached to a post
const uploadPostFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const files = []
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/')
      let fileUrl = `/uploads/posts/${file.filename}`
      let storageType = 'local'

      // Attempt to upload to Cloudinary
      try {
        const cloudinaryResult = await uploadToCloudinary(file.path, 'posts')
        if (cloudinaryResult) {
          fileUrl = cloudinaryResult.secure_url
          storageType = 'cloudinary'
        }
      } catch (err) {
        console.error('Cloudinary post file upload error, using local fallback:', err)
      }

      files.push({
        url:         fileUrl,
        storageType: storageType,
        fileType:    isVideo ? 'video' : 'image',
      })
    }

    res.status(200).json({
      message: 'Files uploaded successfully',
      files,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { uploadProfilePhoto, uploadPostFiles }