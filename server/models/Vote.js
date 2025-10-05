const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema({
    userId : {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    targetId: {type: mongoose.Schema.Types.ObjectId, required: true},
    targetType: {type: String, enum: ["Post", "Comment"], required: true},
    voteType: {type: String, enum: ["up", "down"], required: true}
}, {timestamps: true});

module.exports = mongoose.model("Vote", VoteSchema);