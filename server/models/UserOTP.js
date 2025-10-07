const mongoose = require("mongoose");

const UserOTPSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
    },
    otp: {type: String, require: true},
    createdAt: {type: Date, default: Date.now()},
    ExpiresAt: {type: Date, required: true}
});

module.exports = mongoose.model("UserOTP", UserOTPSchema);