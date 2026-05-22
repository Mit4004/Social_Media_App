const User = require('../models/User')
const Post = require('../models/Post')

// Uploads a new profile photo for the authenticated user
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          profilePhoto: {
            url:         photoUrl,
            storageType: 'local',
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

    const files = req.files.map((file) => {
      const isVideo = file.mimetype.startsWith('video/')
      return {
        url:         `/uploads/posts/${file.filename}`,
        storageType: 'local',
        fileType:    isVideo ? 'video' : 'image',
      }
    })

    res.status(200).json({
      message: 'Files uploaded successfully',
      files,
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { uploadProfilePhoto, uploadPostFiles }