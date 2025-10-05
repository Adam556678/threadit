const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

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

    // Votes and vote counts
    voteCount: {type: Number, default: 0},
    votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vote"
    }]
}, {timestamps: true});

module.exports = mongoose.model("Post", PostSchema);