const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { addComment, getComments, deleteComment } = require('../controllers/comment.controller');

router.post('/:postId',   protect, addComment);
router.get('/:postId',    protect, getComments);
router.delete('/:id',     protect, deleteComment);

module.exports = router;