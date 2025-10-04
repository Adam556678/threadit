const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    votes: {type: Number, default: 0},
    comments: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Comment"
    }],

    // media files (images, videos, etc.)
    media: [
        {
        url: { type: String },     
        type: { type: String }     
        }
    ],

    // which community it belongs to
    community: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Community" 
    },

    createdAt: {type: Date, default: Date.now()},
    UpdatedAt: {type: Date}
});

module.exports = mongoose.model("Post", PostSchema);