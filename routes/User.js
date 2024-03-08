const router = require('express').Router();
const userController = require('../controllers/User');
const requireUser = require('../middlewares/auth');

router.post('/follow', requireUser, userController.followOrUnfollowUserController);
router.get('/getFeedData', requireUser, userController.getFeedDataController);
router.delete('/delete', requireUser, userController.deleteMyProfile);
router.get('/getMyProfile', requireUser, userController.getMyProfile);
router.put('/', requireUser, userController.updateUserProfile);
router.post('/getUserProfile', requireUser, userController.getUserProfile);

module.exports = router;