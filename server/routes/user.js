const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");

// User Signup - POST
router.post("/signup", async (req, res) => {
    email, password, phoneNumber = req.body;
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
        if (!isvalidPhoneNum){
            errors.push("Invalid phone number");
        }

        // hash the password
        const hashedPassword = await hashPassword(password)
    } catch (error) {
        
    }

});