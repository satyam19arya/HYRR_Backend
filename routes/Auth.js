const router = require('express').Router();
const authController = require('../controllers/Auth');
const resetPassword = require('../controllers/ResetPassword');

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.get('/refresh', authController.refreshAccessToken);
router.post('/logout', authController.logout);
router.post('/sendotp', authController.sendOtp);

router.post('/resetpasswordtoken', resetPassword.resetPasswordToken);
router.post('/resetpassword', resetPassword.resetPassword);

module.exports = router;