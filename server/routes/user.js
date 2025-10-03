const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// check login middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({message: "Not logged in"});

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = jwt.decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({message: "Unathorized"});
    }
}

// User Signup - POST
router.post("/signup", async (req, res) => {
    const {email, password, phoneNumber, firstName, lastName, country} = req.body;
    let errors = []

    try {
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
        await User.create({
            username: username,
            email: email,
            password: hashedPassword,            
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            country: country,        
        })
        return res.status(200).json({message: "User created successfully!"});
    } catch (error) {
        return res.status(500).json({error: "Something went wrong"})
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

        // create user's jwt
        const token = jwt.sign({userId: user._id}, JWT_SECRET);
        res.cookie('token', token, {httpOnly: true});

        res.status(200).json({ message: "Login successful", userId: user._id });
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"})
    }
});