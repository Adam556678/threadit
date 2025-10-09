const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const auth = require("../middlewares/auth.js");
const UserOTP = require("../models/UserOTP.js");
const sendVerificationOTP = require("../helpers/otp_verification.js");

const cloudinary = require("../config/cloudinary.js");
const upload = require("../middlewares/upload.js");

JWT_SECRET = process.env.JWT_SECRET;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication routes
 */


/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     description: Creates a new user account and sends an OTP verification code to their email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: MyStrongPassword123!
 *               phoneNumber:
 *                 type: string
 *                 example: "+201001234567"
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               country:
 *                 type: string
 *                 example: Egypt
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A verification code sent to johndoe@example.com
 *       400:
 *         description: Validation error (invalid or weak input)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Verify a user's email
 *     tags: [Users]
 *     description: Confirms a user's email by checking the OTP code sent to them.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: User verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User is verified successfully
 *       400:
 *         description: Wrong or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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
            return res.status(400).json({
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

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     description: Authenticates a user and returns a JWT token in cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: MyStrongPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 userId:
 *                   type: string
 *                   example: 652a1b6e7e1d6c2345cde987
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /users/upload-pfp:
 *   patch:
 *     summary: Upload or update user profile picture
 *     tags: [Users]
 *     description: Uploads a new profile picture for the authenticated user using Cloudinary.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile picture updated
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized (no valid JWT)
 *       500:
 *         description: Server error
 */
router.patch("/upload-pfp", auth, upload.single("profilePic"), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(
            req.file.path, 
            {resource_type: "image"}
        );
        const user = await User.findByIdAndUpdate(
            req.userId, 
            {profilePic: result.secure_url},
            { new: true } 
        );
        return res.status(200).json({message: "User profiled picture updated", user})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

/**
 * @swagger
 * /api/users/logout:
 *   get:
 *     summary: Log out a user
 *     tags: [Users]
 *     description: Clears the authentication token cookie and logs the user out.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout Successful.
 */
router.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.json({message: "Logout Successful."});
});

module.exports = router;