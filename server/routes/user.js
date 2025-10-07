const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const UserOTP = require("../models/UserOTP.js");
const sendVerificationOTP = require("../helpers/otp_verification.js");

JWT_SECRET = process.env.JWT_SECRET;


// User Signup - POST
router.post("/signup", async (req, res) => {
    const {email, password,username ,phoneNumber, firstName, lastName, country} = req.body;
    let errors = []

    try {
        // check if user already exists
        const userExists = await User.findOne({email});
        if (userExists)
            return res.status(400).json({message: "User with this email already exists"});        

        // validate password
        if (!isStrongPassword(password)){
            errors.push("Weak password");
        }
        
        // validate email
        if (!isValidEmail(email)){
            errors.push("Invalid email");
        }
        
        // validate phone Number
        if (phoneNumber && !isvalidPhoneNum(phoneNumber)){
            errors.push("Invalid phone number");
        }

        // cehck for errors
        if (errors.length > 0){
            return res.status(400).json({errors})
        }

        // hash the password
        const hashedPassword = await hashPassword(password)

        // create the user
        const user = new User({
            username: username,
            email: email,
            password: hashedPassword,            
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            country: country,        
        })

        // send an OTP Verfication code 
        await sendVerificationOTP(user);

        await user.save();

        return res.status(200).json({message: `A verification code sent to ${email}`});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: error.message || "Something went wrong"});
    }

});

/*
Verify user's email
params:
body:
    - email
    - otp
*/
router.post("/verify", async (req, res) => {
    try {
        const {email, otp} = req.body;

        // get user document
        const user = await User.findOne({email});
        if (!user)
            return res.status(404).json({message: "User is not found"});
        if (user.verified)
            return res.status(400).json({message: "User is already verified"});

        // get user's verification otp stored in DB
        const queriedOTP = await UserOTP.findOne({userId: user._id});
        if (queriedOTP.ExpiresAt < Date.now()){
            // delete old otp and send a new one
            await UserOTP.deleteMany({userId: user._id});
            await sendVerificationOTP(user, res);
            return res.status(403).json({
                message: `Verification code is expired. A new one was sent to ${user.email}`
            });
        }

        // compare OTP codes
        const same = await bcrypt.compare(otp, queriedOTP.otp);
        if(!same)
            return res.status(400).json({message: "Wrong code"});
        
        // change user's verification state and delete OTP document
        user.verified = true;
        await UserOTP.deleteMany({userId: user._id});
        await user.save();

        return res.status(200).json({message: "User is verified successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"})
    }
});

// User login - POST
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({email: email});
        
        if (!user){
            return res.status(401).json({message: "Invalid credentials"});
        }

        // verify password
        const isMatch = await comparePassword(password, user.password)
        if (!isMatch){
            return res.status(401).json({message: "Invalid credentials"});
        }

        // check if user is verified
        if (!user.verified)
            return res.status(403).json({message: "Please verify your email"});

        // create user's jwt
        const token = jwt.sign({userId: user._id}, JWT_SECRET);
        res.cookie('token', token, {httpOnly: true});

        res.status(200).json({ message: "Login successful", userId: user._id });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"})
    }
});

// Logout - GET
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.json({message: "Logout Successful."});
});

module.exports = router;