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

module.exports = router;