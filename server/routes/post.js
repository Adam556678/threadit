const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middlewares/auth.js");
const postMiddleware = require("../middlewares/member_post.js");
const Comment = require("../models/Comment.js");

// Get post content - GET
router.get("/:postId", auth, postMiddleware, async (req, res) => {
    try {
        const post = req.post;
        return res.status(200).json({post});
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"});
    }
});

// Get post's comments - GET
router.get("/:postId/comments", auth, postMiddleware, async (req, res) => {
    try {
        const comments = await req.post.comments.find();
        return res.status(200).json({comments});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

/*
Add comment route - POST
params:
    - postId
body:
    - text
*/
router.post("/:postId/add-comment", auth, postMiddleware, async (req, res) => {
    try {
        const {postId} = req.params;
        const {text} = req.body;

        // create comment document and push it to comments list
        const comment = await Comment.create({
            author: req.userId,
            postId,
            text
        })
        req.post.comments.push(comment._id);
        await req.post.save();

        return res.status(200).json({message: "Comment added"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});


module.exports = router;