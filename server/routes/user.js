const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");
const UserOTP = require("../models/UserOTP.js");

JWT_SECRET = process.env.JWT_SECRET;

// Nodemailer
const transporter =  nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Function for sending an otp mail to the new users
const sendVerificationOTP = async ({_id, email}, res) => {
    try {
        // generate an OTP
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        // mail options
        const mailOptions = {
            from: process.env.BREVO_EMAIL,
            to: email,
            subject: "Verify your Email",
            html: `<p>Your verification code is <b>${otp}</b>. </p>
            <p>This code expires in <b>1 hour</b></p>`
        }

        // hash the OTP and create its document
        const hashedOTP = await bcrypt.hash(otp, 10);
        await UserOTP.create({
            userId: _id,
            otp: hashedOTP,
            ExpiresAt: Date.now() + 3600000
        })

        // send mail to the user
        await transporter.sendMail(mailOptions);
    } catch (error) {
        return res.status(500).json({
            message: "An error occured while trying to send a verification code",
        });
    }
}

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
        const user = await User.create({
            username: username,
            email: email,
            password: hashedPassword,            
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            country: country,        
        })

        // send an OTP Verfication code 
        await sendVerificationOTP(user, res);

        return res.status(200).json({message: `A verification code sent to ${email}`});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Something went wrong"});
    }

});

/*
Verify user's email
params:
    - userId
body:
    - otp
*/
router.post("/:userId/verify", async (req, res) => {
    try {
        const {userId} = req.params;
        const {otp} = req.body;

        // get user document
        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({message: "User is not found"});
        if (user.verified)
            return res.status(400).json({message: "User is already verified"});

        // get user's verification otp stored in DB
        const queriedOTP = await UserOTP.findOne({userId});
        if (queriedOTP.ExpiresAt < Date.now()){
            // delete old otp and send a new one
            await UserOTP.deleteMany({userId});
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
        await UserOTP.deleteMany({userId});
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