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
const upload = require("../middlewares/upload.js");
const cloudinary = require("../config/cloudinary.js").v2;

/**
 * @swagger
 * tags:
 *   name: Communities
 *   description: API endpoints for managing communities and community posts
 */

/**
 * @swagger
 * /communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               access:
 *                 type: string
 *                 enum: [Public, Private]
 *     responses:
 *       201:
 *         description: Community created successfully
 *       400:
 *         description: Community name already exists
 *       500:
 *         description: Something went wrong
 */
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

/**
 * @swagger
 * /communities:
 *   get:
 *     summary: Get all communities
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved communities
 *       500:
 *         description: Something went wrong
 */
router.get("/", auth, async(req, res) => {
    try {
        const communities = await Community.find();
        return res.status(200).json({communities})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});


/**
 * @swagger
 * /communities/{communityId}/add-post:
 *   post:
 *     summary: Add a post to a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the community
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       500:
 *         description: Something went wrong
 */
router.post("/:communityId/add-post", auth, joined, upload.array("media"), async (req, res) => {
    const {communityId} = req.params;
    const community = req.community;
    const {title, body} = req.body;

    try {
        // handle uploaded media
        const uploadedMedia = [];

        for (file of req.files){
            const result = await cloudinary.uploader.upload(
                file.path,
                {resource_type: file.mimetype.startsWith("video") ? "video" : "image"}
            );

            uploadedMedia.push({
                url: result.secure_url,
                type: file.mimetype.startsWith("video") ? "Video" : "Image"
            });
        }

        // Create post
        const post = await Post.create({
            title,
            body,
            author: req.userId,
            community: communityId,
            media: uploadedMedia
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

/**
 * @swagger
 * /communities/{communityId}/posts:
 *   get:
 *     summary: Get all posts in a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the community
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
 *       500:
 *         description: Something went wrong
 */
router.get("/:communityId/posts", auth, joined, async (req, res) => {
    try {
        const posts = await Post.find({community: req.community._id});
        return res.status(200).json({posts}); 
    } catch (error) {
        return res.status(500).json({message: "Something went wrong"});
    }
});

/**
 * @swagger
 * /communities/{communityId}/join:
 *   post:
 *     summary: Join a community (public or private)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the community to join
 *     responses:
 *       200:
 *         description: Joined community or join request sent
 *       400:
 *         description: Already joined
 *       500:
 *         description: Something went wrong
 */
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

/**
 * @swagger
 * /communities/{communityId}/{postId}:
 *   patch:
 *     summary: Update a post in a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not authorized to edit this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Something went wrong
 */
router.patch("/:communityId/:postId", auth, joined, upload.array("media"), async (req, res) => {
    try {
        const {postId} = req.params
        const {title, body} = req.body

        // handle uploaded media
        const uploadedMedia = [];

        for (file of req.files){
            const result = await cloudinary.uploader.upload(
                file.path,
                {resource_type: file.mimetype.startsWith("video") ? "video" : "image"}
            );

            uploadedMedia.push({
                url: result.secure_url,
                type: file.mimetype.startsWith("video") ? "Video" : "Image"
            });
        }
    
        // get post document
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({message: "Post not found"});
    
        // verify if user is the author
        if (post.author != req.userId)
            return res.status(403).json({message: "You can only edit your own posts"});

        // update post and save
        if (title) post.title = title;
        if (body) post.body = body;
        if (uploadedMedia.length > 0) post.media = uploadedMedia

        await post.save()
        return res.status(200).json({message: "Post updated successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

});

/**
 * @swagger
 * /communities/{communityId}/{postId}:
 *   delete:
 *     summary: Delete a post from a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Something went wrong
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

/**
 * @swagger
 * /communities/{communityId}:
 *   delete:
 *     summary: Delete a community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the community
 *     responses:
 *       200:
 *         description: Community deleted successfully
 *       403:
 *         description: Not authorized (not owner)
 *       500:
 *         description: Something went wrong
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