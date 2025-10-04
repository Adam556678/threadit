const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.js");
const Community = require("../models/Community.js");
const User = require("../models/User");
const joined = require("../middlewares/joined.js");
const Post = require("../models/Post.js");

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


// clear requests
// router.post("/:communityId/clear-req", async (req, res) => {
//     const community = await Community.findById(req.params.communityId);
//     community.joinRequests = [];
//     await community.save();
//     res.status(200).json("Removed");
// });

module.exports = router;