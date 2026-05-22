const Post = require('../models/Post')
const Friend = require('../models/Friend')
const Like = require('../models/Like')
const { z } = require('zod')

const createPostSchema = z.object({
  content:    z.string().optional().default(''),
  visibility: z.enum(['public', 'friends', 'private']).optional().default('public'),
})

// Creates a new post with optional text content and media attachments
const createPost = async (req, res) => {
  try {
    const parsed = createPostSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors })
    }

    const { content, visibility } = parsed.data

    const media = req.files
      ? req.files.map((file) => ({
          url: `/uploads/posts/${file.filename}`,
          storageType: 'local',
          fileType: file.mimetype.startsWith('video/') ? 'video' : 'image',
        }))
      : []

    if (!content && media.length === 0) {
      return res.status(400).json({ message: 'Post must have content or at least one file' })
    }

    const post = await Post.create({
      user: req.userId,
      content,
      media,
      visibility,
    })

    await post.populate('user', 'firstName lastName profilePhoto')

    res.status(201).json({ message: 'Post created successfully', post })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Retrieves a paginated list of posts created by a specific user
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [posts, total] = await Promise.all([
      Post.find({ user: req.params.id })
        .populate('user', 'firstName lastName profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments({ user: req.params.id }),
    ])

    res.status(200).json({
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Deletes a specific post after verifying authorship
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not allowed to delete this post' })
    }

    await post.deleteOne()

    res.status(200).json({ message: 'Post deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}


// Retrieves a paginated timeline of posts from the user and their friends based on visibility settings
const getTimeline = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const friendships = await Friend.find({
      $or: [{ user1: req.userId }, { user2: req.userId }],
    })

    const friendIds = friendships.map((f) =>
      f.user1.toString() === req.userId ? f.user2 : f.user1
    )

    const authorIds = [req.userId, ...friendIds]

    const filter = {
      user: { $in: authorIds },
      $or: [
        { visibility: 'public' },
        { visibility: 'friends', user: { $in: friendIds } },
        { visibility: 'private', user: req.userId },
      ],
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('user', 'firstName lastName profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments(filter),
    ])

    res.status(200).json({
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Likes a post and increments its likes count
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const alreadyLiked = await Like.findOne({ user: req.userId, post: req.params.id })
    if (alreadyLiked) {
      return res.status(400).json({ message: 'You have already liked this post' })
    }

    await Like.create({ user: req.userId, post: req.params.id })
    await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } })

    res.status(200).json({ message: 'Post liked' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Unlikes a post and decrements its likes count
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const like = await Like.findOneAndDelete({ user: req.userId, post: req.params.id })
    if (!like) {
      return res.status(400).json({ message: 'You have not liked this post' })
    }

    await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } })

    res.status(200).json({ message: 'Post unliked' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { createPost, getUserPosts, deletePost, getTimeline, likePost, unlikePost }
