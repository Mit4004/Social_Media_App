const User = require('../models/User')

const getUsers = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query

    const filter = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName:  { $regex: search, $options: 'i' } },
            { email:     { $regex: search, $options: 'i' } },
          ],
        }
      : {}

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

    res.status(200).json({
      users,
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

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ user })
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

const updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not allowed to edit this profile' })
    }

    const parsed = updateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors })
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

const deleteUser = async (req, res) => {
  try {
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not allowed to delete this profile' })
    }

    const deleted = await User.findByIdAndDelete(req.params.id)

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { getUsers, getUserById, updateUser, deleteUser }