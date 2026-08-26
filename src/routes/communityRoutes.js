const express = require('express');
const router = express.Router();
const { createPost, listPosts, addComment } = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { ROLES } = require('../utils/constants');

router.use(protect, allowRoles(ROLES.DOCTOR));
router.post('/', createPost);
router.get('/', listPosts);
router.post('/:id/comments', addComment);

module.exports = router;
