const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    author: {type: mongoose.Schema.Types.ObjectId, required: true},
    text: {type: String, required: true},
    votes: {type: Number, default: 0}
}, {timestamps: true});

module.exports = mongoose.model("Comment", CommentSchema);