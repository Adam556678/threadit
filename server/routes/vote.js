const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.js");
const verifyCommunityMember = require("../middlewares/verify_member.js");
const Vote = require("../models/Vote.js");
const Post = require("../models/Post.js");
const Comment = require("../models/Comment.js");
const User = require("../models/User.js");


/*
record a vote - POST
params: 
body:
    - targetId
    - targetType
    - voteType
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