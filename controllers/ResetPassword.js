const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mailSender = require('../utils/mailSender');
const passwordUpdated = require('../utils/templates/passwordUpdate');

const resetPasswordToken = async (req, res) => {
    try{
        const {email} = req.body;

        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Please provide all the required fields'
            })
        }
        
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }
    
        const token = crypto.randomBytes(20).toString('hex');

        const updatedDetails = await User.findOneAndUpdate(
            { email },   
            { resetPasswordToken: token, resetPasswordExpire: Date.now() + 3600000 }, 
            { new: true } 
        );
    
        const url = `http://localhost:3000/update-password/${token}`;
        const message = `Click on the link below to reset your password:\n\n${url}`;

        await mailSender(
            user.email,
            'Reset Password',
            message
        );

        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        })

    } catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: err.message
        })
    }
}

const resetPassword = async (req, res) => {
    try{
        const {password, confirmPassword, resetPasswordToken} = req.body;

        if(!password || !confirmPassword){
            return res.status(400).json({
                success: false,
                message: 'Please provide all the required fields'
            })
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: 'Passwords and confirm passwords do not match'
            })
        }

        const user = await User.findOne({ resetPasswordToken });
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'Invalid token'
            })
        }

        if(Date.now() > user.resetPasswordExpire){
            return res.status(400).json({
                success: false,
                message: 'Token expired, Please regenerate token'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findOneAndUpdate(
            { resetPasswordToken },
            { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null }, 
            { new: true }
        );

        const emailResponse = await mailSender(
            user.email,
            'Password updated successfully',
            passwordUpdated(user.email, `${user.firstName} ${user.lastName}`)
        );

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        })

    } catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: err.message
        })
    }
}

module.exports = {
    resetPasswordToken,
    resetPassword
}