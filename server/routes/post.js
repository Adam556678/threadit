const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.js");
const postMiddleware = require("../middlewares/member_post.js");

// Get post content - GET
router.get("/:postId", auth, postMiddleware, async (req, res) => {
    try {
        const post = req.post;
        return res.status(200).json({post});
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"});
    }
});

// post voting - POST
router.post("/:postId/vote", auth, postMiddleware, async (req, res) => {
    // get post and the vote type (upvote / downvote)
    const {type} = req.body;
    const {post} = req;
    
    try {
        if (type != "up" && type != "down")
            return res.status(400).json({message: "Invalid vote type"});
        if (type == "up") post.votes += 1;
        else post.votes -= 1;
        
        await post.save();
        return res.status(200).json({message: "Vote recorded"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});