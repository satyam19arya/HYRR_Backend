const { success, error } = require('../utils/responseWrapper');
const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const {mapPostOutput} = require('../utils/Utils');

const createPostController = async (req, res) => {
    try{
        const {caption , postImg} = req.body;
        if(!caption){
            return res.send(error(400, 'caption is required'));
        }

        if(!postImg){
            return res.send(error(400, 'Image is required'));
        }

        const cloudImg = await cloudinary.uploader.upload(postImg, {
            folder: 'postImg',
        });

        const owner = req._id;
        const user = await User.findById(req._id);
        const post = await Post.create({
            owner,
            caption,
            image: {
                publicId: cloudImg.public_id,
                url: cloudImg.url
            }
        });

        user.posts.push(post._id);
        await user.save();
        return res.send(success(201, {post}));

    }catch(e){
        res.send(error(500, e.message));
    }
};

const likeAndUnlikePost = async (req, res) => {
    try{
        const {postId} = req.body;
        const curUserId = req._id;

        const post = await Post.findById(postId).populate('owner');
        if(!post){
            return res.send(error(404,'Post not found'));
        }

        if(post.likes.includes(curUserId)){
            const index = post.likes.indexOf(curUserId);
            post.likes.splice(index, 1);
        }else{
            post.likes.push(curUserId);
        }
        await post.save();
        return res.send(success(200, {post: mapPostOutput(post, req._id)}));

    }catch(e){
        return res.send(error(500, e.message));
    }
};

module.exports = {
    createPostController,
    likeAndUnlikePost
}