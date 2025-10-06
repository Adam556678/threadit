const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.js");
const Community = require("../models/Community.js");
const User = require("../models/User");
const joined = require("../middlewares/joined.js");
const Post = require("../models/Post.js");
const verifyCommunityOwner = require("../middlewares/verify_community_owner.js");
const Comment = require("../models/Comment.js");
const Vote = require("../models/Vote.js");

// Create community - POST
router.post("/", auth, async(req, res) => {
    const {name, description, access} = req.body;

    try {
        const existing = await Community.findOne({name})
    
        // check if community name already exists
        if (existing){ 
            return res.status(400).json({message: "Community name already exists"});
        }
        
        // Create community
        const community = await Community.create({
            name,
            description,
            access,
            owner: req.userId,
            admins: [req.userId],
            members: [req.userId]
        })

        // Assign community to the user
        const user = await User.findById(req.userId);
        if (user){
            user.communities.push(community._id);
            await user.save();
        }

        return res.status(201).json({message: "Community created successfully", community})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

// get all communities
router.get("/", auth, async(req, res) => {
    try {
        const communities = await Community.find();
        return res.status(200).json({communities})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});


// Add post to a specific community 
router.post("/:communityId/add-post", auth, joined, async (req, res) => {
    const {communityId} = req.params;
    const community = req.community;
    const {title, body} = req.body;

    try {
        // Create post
        const post = await Post.create({
            title,
            body,
            author: req.userId,
            community: communityId
        });

        // Add post to the community
        community.posts.push(post._id)
        await community.save();

        return res.status(201).json({message: "Post created successfully", post});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});

// get community posts - GET
router.get("/:communityId/posts", auth, joined, async (req, res) => {
    try {
        const posts = await Post.find({community: req.community._id});
        return res.status(200).json({posts}); 
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"});
    }
});

// join community - POST
router.post("/:communityId/join", auth, async (req, res) => {
    try {
       
        // get community document
        const {communityId} = req.params;
        const community = await Community.findById(communityId);

        // check if user already joined
        const isMember = community.members.includes(req.userId);
        if (isMember)
            return res.status(400).json({message: "User already joined"});

        // check community status
        if (community.access == "Public"){
            
            // add user to the community without request
            community.members.push(req.userId);
            community.memberCount += 1;
            await community.save();
            return res.status(200).json({message: "Joined community successfully"});

        }else{ // community is Private
            
            if (community.joinRequests.includes(req.userId)){
                return res.status(403).json({message: "You already requested to join"});
            }else{
                // make a join request and store it in requests
                community.joinRequests.push(req.userId);
                await community.save();

                return res.status(200).json({message: "Join request sent to admins"});
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});

/* 
Update post - PATCH
params:
    - postId
body:
    - title
    - body
 */
router.patch("/:communityId/:postId", auth, joined, async (req, res) => {
    try {
        const {postId} = req.params
        const {title, body} = req.body
    
        // get post document
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({message: "Post not found"});
    
        // verify if user is the author
        if (post.author != req.userId)
            return res.status(403).json({message: "You can only edit your own posts"});

        // update post and save
        if (title) post.title = title;
        if (body) post.body = body;

        await post.save()
        return res.status(200).json({message: "Post updated successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});

/* 
Delete post - DELETE
params:
    - postId
body:
 */
router.delete("/:communityId/:postId", auth, joined, async (req, res) => {
    try {
        const {postId} = req.params
    
        // get post document
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({message: "Post not found"});
        
        // verify if user is the author or an admin
        const isAdmin = await req.community.admins.some(id => id.equals(req.userId));
        if (post.author != req.userId && !isAdmin)
            return res.status(403).json({message: "You can only delete your own posts"});

        // delete post from the community post's list 
        req.community.posts.pull(postId);
        await req.community.save();

        // delete votes of this post
        await Vote.deleteMany({targetId: postId});

        // delete comments and comment's votes of this post
        const commentIds = await Comment.find({postId}).distinct("_id"); 
        await Vote.deleteMany({targetId: {$in: commentIds}, targetType: "Comment"});
        await Comment.deleteMany({postId});        

        await post.deleteOne();

        return res.status(200).json({message: "Post deleted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});

/*
Delete community - DELETE
params:
    - communityId
body:
*/
router.delete("/:communityId", auth, verifyCommunityOwner, async (req, res) => {
    try {
        const community = req.community;

        // delete community's posts & votes
        for (const postId of community.posts){
            
            // delete votes related to this post (and comments) 
            const commentIds =await Comment.find({postId}).distinct("_id"); 
            await Vote.deleteMany({
                $or: [
                    {targetId: postId, targetType: "Post"},
                    {targetId: {$in: commentIds}, targetType: "Comment"}
                ]
            });
            
            // Delete post's comment and the post
            await Comment.deleteMany({postId});
            await Post.findByIdAndDelete(postId);
        }

        // delete community and save
        await req.community.deleteOne();
        return res.status(200).json({message: "Community deleted"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

module.exports = router;