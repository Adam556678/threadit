const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middlewares/auth.js");
const postMiddleware = require("../middlewares/member_post.js");
const Comment = require("../models/Comment.js");
const Vote = require("../models/Vote.js");

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
params
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

/*
Update comment - PATCH
params:
    - postId
    - commentId
body:
    - text
*/
router.patch("/:postId/:commentId", auth, postMiddleware, async (req, res) => {
    try {
        const {commentId} = req.params;
        const {text} = req.body;
        
        if (!text || text.trim() === "")
            return res.status(400).json({message: "Comment text is required"});
        
        // get comment document
        const comment = await Comment.findById(commentId);
        if (!comment)
            return res.status(404).json({message: "Comment not found"});
        
        if (!comment.postId.equals(req.post._id))
            return res.status(403).json({ message: "Comment does not belong to this post" });
        
        // check if user is the author
        if (!comment.author.equals(req.userId))
            return res.status(403).json({message: "You can only edit your own comments"});
        
        // update comment's text
        comment.text = text;
        await comment.save();
        
        return res.status(200).json({message: "Comment updated successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

/*
Delete comment - DELETE
params:
- postId
- commentId
body:
*/
router.delete("/:postId/:commentId", auth, postMiddleware, async (req, res) => {
    try {
        const {commentId} = req.params;
        
        // get comment document
        const comment = await Comment.findById(commentId);
        if (!comment)
            return res.status(404).json({message: "Comment not found"});

        // check if user is the author or admin
        const isAdmin = req.comunity.admins.some(id => id.equals(req.userId));
        if (!comment.author.equals(req.userId) && !isAdmin)
            return res.status(403).json({message: "User not allowed to delete this comment"});

        // delete comment's votes
        await Vote.deleteMany({targetId: commentId});
        
        // delete the comment itself and remove it from the post's comments list
        await Comment.findByIdAndDelete(commentId);
        req.post.comments.pull(commentId);
        await req.post.save();
        
        return res.status(200).json({message: "Comment deleted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

module.exports = router;