const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    author: {type: mongoose.Schema.Types.ObjectId, required: true},
    text: {type: String, required: true},
    voteCount: {type: Number, default: 0},
    votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vote"
    }]
}, {timestamps: true});

module.exports = mongoose.model("Comment", CommentSchema);