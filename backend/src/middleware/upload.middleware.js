const multer = require('multer')
const path = require('path')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/quicktime', 'video/avi']

const profileStorage = multer.diskStorage({
  // Determines the storage folder destination for profile photos.
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/')
  },
  // Generates a unique filename for uploaded profile photos.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.userId}_${Date.now()}${ext}`)
  },
})

const postStorage = multer.diskStorage({
  // Determines the storage folder destination for post media.
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/')
  },
  // Generates a unique filename for uploaded post media.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`)
  },
})

// Filters profile photo uploads to ensure they are allowed image types
const profileFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true)  
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed for profile photo'), false)
  }
}

// Filters post media uploads to ensure they are allowed image or video types
const postFileFilter = (req, file, cb) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype)

  if (isImage || isVideo) {
    cb(null, true)
  } else {
    cb(new Error('Only images (JPEG, PNG, WEBP) and videos (MP4, MOV, AVI) are allowed'), false)
  }
}

const uploadProfile = multer({
  storage:    profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  
  },
})

const uploadPost = multer({
  storage:    postStorage,
  fileFilter: postFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,  
  },
})

module.exports = { uploadProfile, uploadPost }