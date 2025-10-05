const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const verifyCommunityMember = require("../helpers/verify_member.js");



/*
record a vote - POST
params: 
body:
    - targetId
    - targetType
*/
router.post("/vote", auth, verifyCommunityMember, async (req, res) => {

})