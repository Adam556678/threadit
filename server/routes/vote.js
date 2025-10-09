const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.js");
const verifyCommunityMember = require("../middlewares/verify_member.js");
const Vote = require("../models/Vote.js");
const Post = require("../models/Post.js");
const Comment = require("../models/Comment.js");
const User = require("../models/User.js");

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: API endpoints for managing post's and comment's votes
 */



/**
 * @swagger
 * /votes/vote:
 *   post:
 *     summary: Record a vote (upvote or downvote) on a Post or Comment
 *     description: |
 *       Allows an authenticated community member to vote on a post or comment.  
 *       - If the user hasn’t voted before → creates a new vote.  
 *       - If the user presses the same vote again → removes their vote.  
 *       - If the user switches from up to down (or vice versa) → updates their vote.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetId
 *               - targetType
 *               - voteType
 *             properties:
 *               targetId:
 *                 type: string
 *                 description: The ID of the post or comment being voted on.
 *                 example: "64fa0b23b6f73a0012b9c1de"
 *               targetType:
 *                 type: string
 *                 description: The type of the target (either Post or Comment).
 *                 enum: [Post, Comment]
 *                 example: "Post"
 *               voteType:
 *                 type: string
 *                 description: The type of the vote (up or down).
 *                 enum: [up, down]
 *                 example: "up"
 *     responses:
 *       200:
 *         description: Vote recorded or removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vote recorded"
 *       400:
 *         description: Invalid voting type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid voting type"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (user is not a member of the community)
 *       404:
 *         description: Post or Comment not found.
 *       500:
 *         description: Server error.
 */

router.post("/vote", auth, verifyCommunityMember, async (req, res) => {
    try {
        const {targetId, targetType, voteType} = req.body;
        
        if (!["up", "down"].includes(voteType))
            return res.status(400).json({message: "Ivalid voting type"});

        // check if user already voted on this target
        const existingVote = await Vote.findOne({
            userId: req.userId, 
            targetId, 
            targetType
        })

        // get the target model
        const TargetModel = targetType === "Post" ? Post : Comment;
        const targetDoc = await TargetModel.findById(targetId);
        if (!targetDoc) return res.status(404).json({meassage: `${targetType} not found`});

        // get the document author
        const docAuthor = await User.findById(targetDoc.author);

        // ---- Case 1 : User hasn't voted yet ---
        if (!existingVote){
            // create vote document and adding it to the votes list
            const vote = await Vote.create({
                userId: req.userId,
                targetId,
                targetType,
                voteType,
            });
            targetDoc.votes.push(vote._id);

            // update vote counts of the target
            const newVoteCount = voteType === "up" ? 1 : -1;
            targetDoc.voteCount += newVoteCount;
            await targetDoc.save();

            // update author karma
            docAuthor.karma += newVoteCount;
            await docAuthor.save();
            
            return res.status(200).json({message: "Vote recorded"});
        }
        
        // ---- Case 2: User presses the same vote again (remove vote) ---
        else if (existingVote.voteType === voteType){
            // remove vote from the target, delete the vote document and update vote count
            targetDoc.votes.pull(existingVote._id);
            await existingVote.deleteOne();
            
            const newVoteCount = voteType === "up" ? -1 : 1;
            targetDoc.voteCount += newVoteCount;
            await targetDoc.save();

            // update author karma
            docAuthor.karma += newVoteCount;
            await docAuthor.save();
            
            return res.status(200).json({message: "Vote removed"});
        }
        
        // ---- Case 3: User switched votes ----
        else{
            existingVote.voteType = voteType;
            await existingVote.save();
            
            const newVoteCount = voteType === "up" ? 2 : -2;
            targetDoc.voteCount += newVoteCount;
            await targetDoc.save();
            
            // update author karma
            docAuthor.karma += newVoteCount;
            await docAuthor.save();

            return res.status(200).json({message: "Vote recorded"});
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
                
    }
})

module.exports = router;