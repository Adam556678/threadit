const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
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

        // check if the voter already voted
        const existingVote = post.votes.users
        .find(v => v.userId.equals(req.userId));
        
        // user voted before
        if (existingVote){
            // case 1: same vote type again (ignore)
            if (existingVote.voteType == type)
                return res.status(200).json({message: "Vote already recorded"});

            // case 2: user switched vote
            if (existingVote.voteType == "up" && type == "down"){
                post.votes.count -= 2;
            }else if (existingVote.voteType == "down" && type == "up"){
                post.votes.count += 2;
            }

            // update the vote type
            existingVote.voteType = type;

        // user didn't vote before
        }else{
            if (type == "up") post.votes.count += 1;
            else post.votes.count -= 1;

            post.votes.users.push({
                userId: req.userId,
                voteType: type
            });
        }        
        
        await post.save();
        return res.status(200).json({message: "Vote recorded"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

module.exports = router;