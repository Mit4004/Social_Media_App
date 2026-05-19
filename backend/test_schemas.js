require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

const User = require('./src/models/User');
const Post = require('./src/models/Post');
const Friend = require('./src/models/Friend');
const FriendRequest = require('./src/models/FriendRequest');

const runTest = async () => {
  try {
    await connectDB();
    console.log("Starting Schema Test...");

    // 1. Test User Creation
    const user1 = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: `john_${Date.now()}@example.com`,
      mobile: "1234567890",
      password: "password123",
      bio: "Hello world"
    });

    const user2 = await User.create({
      firstName: "Jane",
      lastName: "Smith",
      email: `jane_${Date.now()}@example.com`,
      mobile: "0987654321",
      password: "password123"
    });
    console.log("✅ Users created successfully");

    // 2. Test Post Creation
    const post = await Post.create({
      user: user1._id,
      content: "This is a test post!",
      images: [{ url: "http://example.com/image.jpg" }]
    });
    console.log("✅ Post created successfully");

    // 3. Test FriendRequest Creation
    const friendRequest = await FriendRequest.create({
      sender: user1._id,
      receiver: user2._id,
      status: "pending"
    });
    console.log("✅ FriendRequest created successfully");

    // 4. Test Friend Creation
    const friend = await Friend.create({
      user1: user1._id,
      user2: user2._id
    });
    console.log("✅ Friend relation created successfully");

    // 5. Test Populating
    const populatedPost = await Post.findById(post._id).populate('user', 'firstName lastName');
    console.log("✅ Populated Post User:", populatedPost.user.firstName, populatedPost.user.lastName);

    const populatedRequest = await FriendRequest.findById(friendRequest._id)
      .populate('sender', 'firstName')
      .populate('receiver', 'firstName');
    console.log(`✅ Populated Friend Request: ${populatedRequest.sender.firstName} -> ${populatedRequest.receiver.firstName}`);

    const populatedFriend = await Friend.findById(friend._id)
      .populate('user1', 'firstName')
      .populate('user2', 'firstName');
    console.log(`✅ Populated Friend Relation: ${populatedFriend.user1.firstName} and ${populatedFriend.user2.firstName}`);

    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Data is storing perfectly.");
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

runTest();
