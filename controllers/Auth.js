const User = require('../models/User');
const OTP = require('../models/Otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { error, success } = require('../utils/responseWrapper');
const otpGenerator = require('otp-generator');
const mailSender = require('../utils/mailSender');
const passwordUpdated = require('../utils/templates/passwordUpdate');

const sendOtp = async(req, res) => {
    try{
        const {email} = req.body;
        if(!email){
            return res.send(error(400, 'Email is required'));
        }

        const user = await User.findOne({email});
        if(user){
            return res.send(error(409, 'User is already registered'));
        }

        const otp = otpGenerator.generate(6, { 
            upperCaseAlphabets: false, 
            specialChars: false, 
            lowerCaseAlphabets: false
         });
        console.log("OTP generated", otp);

        const result = await OTP.findOne({otp});
        while(result){
            console.log("OTP already exists");
            otp = otpGenerator.generate(6, { 
                upperCaseAlphabets: false, 
                specialChars: false, 
                lowerCaseAlphabets: false
             });
            console.log("OTP generated", otp);
        }

        const newOtp = new OTP({
            email,
            otp
        });
        
        await newOtp.save();

        return res.send(success(200, 'OTP sent successfully'));

    } catch(err){
        console.log(err);
        return res.send(error(500, err.message));
    }
}

const signUp = async(req, res) => {
    try{
        const {name, email , password, confirmPassword, otp} = req.body;
        
        if(!name || !email || !password || !confirmPassword || !otp){
            return res.send(error(400, 'All fields are required'));
        }

        if(password !== confirmPassword){
            return res.send(error(400, 'Passwords do not match'));
        }

        const oldUser = await User.findOne({email});
        if(oldUser){
            return res.send(error(409, 'User is already registered'));
        }

        const response = await OTP.findOne({email}).sort({createdAt: -1});
        if(!response){
            return res.send(error(404, 'OTP not found'));
        }

        if(response.otp !== otp){
            return res.send(error(403, 'Invalid OTP'));
        }
 
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email, 
            password: hashedPassword,
            avatar: `https://api.dicebear.com/5.x/initials/svg?seed=${name}&background=%23fff&radius=50`
        })

        return res.send(success(201, user));

    }catch(e){
        return res.send(error(500,e.message));
    }
}

const logIn = async(req, res) => {
    try{
        const {email , password} = req.body;
        
        if(!email || !password){
            return res.send(error(400, 'All fields are required'));
        }

        const user = await User.findOne({email}).select("+password");
        if(!user){
            return res.send(error(404, 'User not found'));
        }

        const matched = await bcrypt.compare(password, user.password);
        if(!matched){
            return res.send(error(403, 'Invalid credentials'));
        }

        const accessToken = generateAccessToken({ _id: user._id})
        const refreshToken = generateRefreshToken({ _id: user._id})

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true
        })

        return res.send(success(200, {accessToken}));
        
    }catch(e){
        return res.send(error(500,e.message));
    }
};

const refreshAccessToken = async(req, res) => {
    const cookies = req.cookies;
    if(!cookies.jwt){
        return res.send(error(401, 'Refresh token in cookie is required'));
    }

    const refreshToken = cookies.jwt;

    try{
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PRIVATE_KEY);
        const _id = decoded._id;
        const accessToken = generateAccessToken({_id});
        return res.send(success(201, {accessToken}));
    }catch(e){
        console.log(e);
        return res.send(error(401, 'Invalid refresh token'));
    }
};

const logout = async (req, res) => {
    try{
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: true
        });
        return res.send(success(200, 'user logged out'));
    }catch(e){
        return res.send(error(500, e.message));
    }
};

const generateAccessToken = (data) => {
    try{
        const token = jwt.sign(data, process.env.ACCESS_TOKEN_PRIVATE_KEY, {expiresIn: '1d'});
        return token;
    }catch(e){
        console.log(e);
    }
}

const generateRefreshToken = (data) => {
    try{
        const token = jwt.sign(data, process.env.REFRESH_TOKEN_PRIVATE_KEY, {expiresIn: '1y'});
        return token;
    }catch(e){
        console.log(e);
    }
}

module.exports = {
    sendOtp,
    signUp,
    logIn,
    refreshAccessToken,
    logout
};