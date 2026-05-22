const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Creates a new comment on a post and increments the post's comment count.
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.userId,
      text: text.trim(),
    });

    await Post.findByIdAndUpdate(req.params.postId, {
      $inc: { commentsCount: 1 },
    });

    await comment.populate('user', 'firstName lastName profilePhoto');

    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Retrieves all comments for a specific post, with option to sort.
const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const sortOrder = req.query.sort === 'newest' ? -1 : 1 // default: oldest first

    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'firstName lastName profilePhoto')
      .sort({ createdAt: sortOrder });

    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Deletes a comment after authorizing that the requesting user is the creator, and decrements the post's comment count.
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { addComment, getComments, deleteComment };