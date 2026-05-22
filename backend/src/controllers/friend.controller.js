const FriendRequest = require('../models/FriendRequest');
const Friend = require('../models/Friend');

// Sends a new friend request from the logged-in user to another user.
const sendRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You can't send a request to yourself" });
    }

    const alreadyFriend = await Friend.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    });
    if (alreadyFriend) {
      return res.status(400).json({ message: 'You are already friends' });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    res.status(201).json({ message: 'Friend request sent', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accepts a pending friend request and creates a friendship record in the database.
const acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    request.status = 'accepted';
    await request.save();

    await Friend.create({
      user1: request.sender,
      user2: request.receiver,
    });

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Rejects a pending friend request by updating its status to 'rejected'.
const rejectRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Removes a friendship between two users.
const unfriend = async (req, res) => {
  try {
    const userId = req.userId;
    const otherId = req.params.id;

    const friendship = await Friend.findOneAndDelete({
      $or: [
        { user1: userId, user2: otherId },
        { user1: otherId, user2: userId },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.json({ message: 'Unfriended successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Retrieves all pending friend requests sent to the logged-in user.
const getRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: 'pending',
    }).populate('sender', 'firstName lastName profilePhoto');

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Retrieves the friends list of a user, hiding sensitive fields if the viewer is not a friend.
const getFriends = async (req, res) => {
  try {
    const userId = req.query.userId || req.userId;

    const friendships = await Friend.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate('user1', 'firstName lastName email profilePhoto')
      .populate('user2', 'firstName lastName email profilePhoto');

    const friends = friendships
      .map((f) => {
        if (!f.user1 || !f.user2) return null;
        return f.user1._id.toString() === userId.toString() ? f.user2 : f.user1;
      })
      .filter(Boolean);

    const currentUserId = req.userId ? req.userId.toString() : '';

    const processedFriends = friends.map(friend => {
      const friendObj = friend.toObject ? friend.toObject() : friend;
      const friendId = friendObj._id.toString();
      const isSelf = friendId === currentUserId;

      if (!isSelf) {
        delete friendObj.email;
      }
      return friendObj;
    });

    res.json({ friends: processedFriends });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  unfriend,
  getRequests,
  getFriends,
};