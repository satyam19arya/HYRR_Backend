const router = require('express').Router();
const postsController = require('../controllers/Posts');
const requireUser = require('../middlewares/auth');

router.post('/', requireUser, postsController.createPostController);
router.post('/like', requireUser, postsController.likeAndUnlikePost);

module.exports = router;