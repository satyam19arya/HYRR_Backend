const { success, error } = require('../utils/responseWrapper');
const User = require('../models/User');
const Post = require('../models/Post');
const { mapPostOutput } = require('../utils/Utils');
const cloudinary = require('cloudinary').v2;

const followOrUnfollowUserController = async (req, res) => {
    try{
        const { userIdToFollow } = req.body;
        const curUserId = req._id;

        const userToFollow = await User.findById(userIdToFollow);
        const curUser = await User.findById(curUserId);

        if(curUserId === userIdToFollow){
            return res.send(error(409, "Users can't follow themselves"));
        }

        if(!userToFollow){
            return res.send(error(404, "User to follow not found"));
        }

        if(curUser.followings.includes(userIdToFollow)){
            const followingIndex = curUser.followings.indexOf(userIdToFollow);
            curUser.followings.splice(followingIndex, 1);

            const followerIndex = userToFollow.followers.indexOf(curUser);
            userToFollow.followers.splice(followerIndex, 1);

        }else{
            userToFollow.followers.push(curUserId);
            curUser.followings.push(userIdToFollow);        
        }

        await userToFollow.save();
        await curUser.save();
        return res.send(success(200, {user: userToFollow}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const getFeedDataController = async (req, res) => {
    try{
        const curUserId = req._id;
        const curUser = await User.findById(curUserId).populate('followings');

        const fullPosts = await Post.find({
            'owner': {
                '$in': curUser.followings
            }
        }).populate('owner');
        const posts = fullPosts.map( (item) => mapPostOutput(item, req._id)).reverse();
        
        const followingsIds = curUser.followings.map((item) => item._id);
        followingsIds.push(req._id);  //so that we cant see our id in suggestions

        const suggestions = await User.find({
            _id: {
                $nin: followingsIds,
            },
        });

        return res.send(success(200, {...curUser._doc, suggestions, posts}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const getMyPosts = async (req, res) => {
    try{
        const curUserId = req._id;
        const allUserPosts = await Post.find({owner: curUserId}).populate('likes');

        return res.send(success(200, {allUserPosts}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const getUserPosts = async (req, res) => {
    try{
        const userId = req.body.userId;
        if(!userId){
            res.send(error(400, "User not found"));
        }
        const allUserPosts = await Post.find({owner: userId}).populate('likes');

        return res.send(success(200, {allUserPosts}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const deleteMyProfile = async (req, res) => {
    try {
        const curUserId = req._id;
        const curUser = await User.findById(curUserId);

        //Delete all posts and remove likes and comments from posts
        const userPosts = await Post.find({ owner: curUserId });
        for (const post of userPosts) {
            // Remove likes
            post.likes.pull(curUserId);
            // Remove comments by the user
            post.comments = post.comments.filter(comment => comment.owner.toString() !== curUserId.toString());
            await post.save();
        }

        //Update followers and followings
        const followers = await User.find({ _id: { $in: curUser.followers } });
        const followings = await User.find({ _id: { $in: curUser.followings } });

        for (const follower of followers) {
            follower.followings.pull(curUserId);
            await follower.save();
        }

        for (const following of followings) {
            following.followers.pull(curUserId);
            await following.save();
        }

        //Delete profile image from cloudinary
        if (curUser.avatar.publicId) {
            await cloudinary.uploader.destroy(curUser.avatar.publicId);
        }

        //Remove user and clear JWT cookie
        await curUser.remove();
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: true,
        });

        return res.send(success(200, "User deleted successfully"));

    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const getMyInfo = async (req, res) => {
    try{
        const curUserId = req._id;
        const user = await User.findById(curUserId);
        return res.send(success(200, {user}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const updateUserProfile = async (req, res) => {
    try{
        const {name, bio, userImg} = req.body;
        const curUserId = req._id;
        const user = await User.findById(curUserId);

        if(name){
            user.name = name;
        }
        if(bio){
            user.bio = bio;
        }
        if(userImg){
            const cloudImg = await cloudinary.uploader.upload(userImg, {
                folder: 'profileImg'
            })
            user.avatar = {
                url: cloudImg.secure_url,
                publicId: cloudImg.public_id
            }
        }

        await user.save();
        return res.send(success(200, {user}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

const getUserProfile = async (req, res) => {
    try{
        const userId = req.body.userId;
        const user = await User.findById(userId).populate({
            path: 'posts',
            populate: {
                path: 'owner'
            },
        })
        .populate("followers")
        .populate("followings");

        const fullPosts = user.posts;
        const posts = fullPosts.map( (item) => mapPostOutput(item, req._id)).reverse();

        return res.send(success(200, {...user._doc, posts}));  //doc -> give only relevant information

    }catch(e){
        return res.send(error(500, e.message));
    }
};

module.exports = {
    followOrUnfollowUserController,
    getFeedDataController,
    getMyPosts,
    getUserPosts,
    deleteMyProfile,
    getMyInfo,
    updateUserProfile,
    getUserProfile
};