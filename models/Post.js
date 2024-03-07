const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    image: {
        publicId: String,
        url: String
    },
    caption: {
        type: String,
        required: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    comments: [
        {
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            content: {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('post', postSchema);