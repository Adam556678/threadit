const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middlewares/auth.js");
const postMiddleware = require("../middlewares/member_post.js");
const Comment = require("../models/Comment.js");
const Vote = require("../models/Vote.js");

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts and comments
 */

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get a specific post's content
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: Successfully retrieved post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Something went wrong
 */
router.get("/:postId", auth, postMiddleware, async (req, res) => {
    try {
        const post = req.post;
        return res.status(200).json({post});
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"});
    }
});

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a specific post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: Successfully retrieved comments
 *       404:
 *         description: Post not found
 *       500:
 *         description: Something went wrong
 */
router.get("/:postId/comments", auth, postMiddleware, async (req, res) => {
    try {
        const comments = await req.post.comments.find();
        return res.status(200).json({comments});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

/**
 * @swagger
 * /posts/{postId}/add-comment:
 *   post:
 *     summary: Add a comment to a specific post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This post is amazing!"
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Something went wrong
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

/**
 * @swagger
 * /posts/{postId}/{commentId}:
 *   patch:
 *     summary: Update a comment on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Edited comment text"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Comment text is required
 *       403:
 *         description: Not authorized to edit this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Something went wrong
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

/**
 * @swagger
 * /posts/{postId}/{commentId}:
 *   delete:
 *     summary: Delete a comment from a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Something went wrong
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