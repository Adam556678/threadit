const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const {hashPassword, comparePassword} = require("../helpers/hash.js");
const {isValidEmail, isStrongPassword, isvalidPhoneNum} = require("../helpers/validators.js");

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