const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  unfriend,
  getRequests,
  getFriends,
} = require('../controllers/friend.controller');

router.post('/request/:id',  protect, sendRequest);
router.post('/accept/:id',   protect, acceptRequest);
router.post('/reject/:id',   protect, rejectRequest);
router.delete('/unfriend/:id', protect, unfriend);
router.get('/requests',      protect, getRequests);
router.get('/list',          protect, getFriends);

module.exports = router;