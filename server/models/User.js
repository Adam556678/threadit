const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    karma: {type: Number, default: 0},
    
    // Optional profile info
    firstName: {type: String},
    lastName: {type: String},
    phoneNumber: {type: String},
    country: {type: String},

    profilePic: {type: String},

    posts: [{type: mongoose.Schema.Types.ObjectId, ref: "Post"}],
    communities: [{type: mongoose.Schema.Types.ObjectId, ref: "Community"}],

    createdAt: {type: Date, default: Date.now()}
});

module.exports = mongoose.model("User", UserSchema);