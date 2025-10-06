const express = require("express");
const auth = require("../middlewares/auth");
const verifyMember = require("../middlewares/member_post");
const Comment = require("../models/Comment");
const router = express.Router();

/*
Add comment route - POST
params:
    - postId
body:
    - text
*/
router.post("/:postId/add-comment", auth, verifyMember, async (req, res) => {
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