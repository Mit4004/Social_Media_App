const User = require('../models/User')
const Friend = require('../models/Friend')
const FriendRequest = require('../models/FriendRequest')
const Post = require('../models/Post')
const Like = require('../models/Like')
const Comment = require('../models/Comment')

// Retrieves a paginated, sorted, and optionally filtered list of users (excluding password)
const getUsers = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query

    const baseFilter = req.userId ? { _id: { $ne: req.userId } } : {}
    const filter = search
      ? {
          ...baseFilter,
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName:  { $regex: search, $options: 'i' } },
          ],
        }
      : baseFilter

    const skip = (Number(page) - 1) * Number(limit)

    const sortOrder = order === 'asc' ? 1 : -1

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ])

    const currentUserId = req.userId ? req.userId.toString() : '';

    const processedUsers = users.map(user => {
      const userObj = user.toObject();
      if (userObj._id.toString() !== currentUserId) {
        delete userObj.email;
      }
      return userObj;
    });

    res.status(200).json({
      users: processedUsers,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Retrieves details of a specific user by their ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const currentUserId = req.userId ? req.userId.toString() : '';
    const targetUserId = user._id.toString();
    const isSelf = targetUserId === currentUserId;

    const userObj = user.toObject();
    if (!isSelf) {
      delete userObj.email;
    }

    res.status(200).json({ user: userObj })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

const { z } = require('zod')

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
  mobile:    z.string().min(10).optional(),
  bio:       z.string().max(300).optional(),
})

// Updates user profile details after validating request data
const updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not allowed to edit this profile' })
    }

    const parsed = updateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.errors[0]?.message || 'Validation failed',
        errors: parsed.error.errors
      })
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true }
    ).select('-password')

    if (!updated) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'Profile updated', user: updated })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// Deletes a user profile and cascades deletion of all associated posts, friendships, and interactions
const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id
    if (userIdToDelete !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not allowed to delete this profile' })
    }

    // Find the user's posts to delete associated comments and likes
    const userPosts = await Post.find({ user: userIdToDelete }).select('_id')
    const postIds = userPosts.map(p => p._id)

    // Delete the user
    const deleted = await User.findByIdAndDelete(userIdToDelete)

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Execute cascade deletes in parallel
    await Promise.all([
      Post.deleteMany({ user: userIdToDelete }),
      Friend.deleteMany({ $or: [{ user1: userIdToDelete }, { user2: userIdToDelete }] }),
      FriendRequest.deleteMany({ $or: [{ sender: userIdToDelete }, { receiver: userIdToDelete }] }),
      Like.deleteMany({ $or: [{ user: userIdToDelete }, { post: { $in: postIds } }] }),
      Comment.deleteMany({ $or: [{ user: userIdToDelete }, { post: { $in: postIds } }] }),
    ])

    res.status(200).json({ message: 'User and all associated data deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { getUsers, getUserById, updateUser, deleteUser }