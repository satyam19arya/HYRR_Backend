const router = require('express').Router();
const postsController = require('../controllers/Posts');
const requireUser = require('../middlewares/auth');

router.post('/', requireUser, postsController.createPostController);
router.post('/like', requireUser, postsController.likeAndUnlikePost);
router.get('/posts', requireUser, postsController.getAllPosts);

module.exports = router;