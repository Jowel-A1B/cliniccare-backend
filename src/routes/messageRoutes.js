const express = require('express');
const router = express.Router();
const { sendMessage, getThread, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/thread/:otherUserId', getThread);

module.exports = router;
