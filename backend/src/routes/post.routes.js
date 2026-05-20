const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const { uploadPost } = require('../middleware/upload.middleware')
const { createPost, getUserPosts, deletePost, getTimeline, likePost, unlikePost } = require('../controllers/post.controller')

const handleMulterError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message })
    next()
  })
}

router.post('/',            protect, handleMulterError(uploadPost.array('files', 5)), createPost)
router.get('/timeline',     protect, getTimeline)
router.get('/user/:id',     protect, getUserPosts)
router.delete('/:id',       protect, deletePost)
router.post('/:id/like',    protect, likePost)
router.delete('/:id/like',  protect, unlikePost)

module.exports = router
