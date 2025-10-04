const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, 
    description: { type: String },
    bannerImage: { type: String },
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],

    access: {
        type: String,
        enum: ["Public", "private"],
        default: "Public"
    },

    memberCount: {type: Number, default: 1},
},

{timestamps: true}
);

module.exports = mongoose.model("Community", CommunitySchema);