const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const { uploadProfile, uploadPost } = require('../middleware/upload.middleware')
const { uploadProfilePhoto, uploadPostFiles } = require('../controllers/upload.controller')

const handleMulterError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}

router.post(
  '/profile',
  protect,
  handleMulterError(uploadProfile.single('photo')),
  uploadProfilePhoto
)

router.post(
  '/post',
  protect,
  handleMulterError(uploadPost.array('files', 5)),
  uploadPostFiles
)

module.exports = router