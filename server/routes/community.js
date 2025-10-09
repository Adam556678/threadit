const express = require("express");
const router = express.Router();
const Community = require("../models/Community.js");
const User = require("../models/User");
const Post = require("../models/Post.js");
const Comment = require("../models/Comment.js");
const Vote = require("../models/Vote.js");
const upload = require("../middlewares/upload.js");
const cloudinary = require("../config/cloudinary.js").v2;
const auth = require("../middlewares/auth.js");
const joined = require("../middlewares/joined.js");
const verifyCommunityOwner = require("../middlewares/verify_community_owner.js");
const verifyCommunityAdmin = require("../middlewares/verify_community_admin.js");

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
 * /communities/{communityId}/{userRequestedId}/accept-join:
 *   post:
 *     summary: Accept a user's join request to a community
 *     description: Allows a community admin to approve a user's join request, adding them as a member of the community.
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []  # Uses JWT authentication
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the community
 *       - in: path
 *         name: userRequestedId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user who requested to join
 *     responses:
 *       200:
 *         description: User successfully added to the community
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User added to community successfully
 *                 community:
 *                   type: object
 *                   description: The updated community document
 *       400:
 *         description: Bad request (user already a member or didn't request to join)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User didn't request to join the community
 *       403:
 *         description: Forbidden — only admins can perform this action
 *       404:
 *         description: Community not found
 *       500:
 *         description: Internal server error
 */
router.post("/:communityId/:userRequestedId/accept-join", auth, verifyCommunityAdmin, async (req, res) => {
    try {
        const {userRequestedId} = req.params
        
        // check if user is already a member
        const isMember = req.community.members.some(id => id.equals(userRequestedId));
        if (isMember)
            return res.status(400).json({message: "User is already a member of this community"});
        
        // check if user actually requested to join
        const requested = req.community.joinRequests.some(id => id.equals(userRequestedId));
        if (!requested)
            return res.status(400).json({message: "User didn't request to join the community"});
        
        // add user to the community
        req.community.members.push(userRequestedId);
        req.community.memberCount += 1;

        // remove user from join requests
        req.community.joinRequests = req.community.joinRequests.filter(
            id => id.toString() != userRequestedId
        ); 
        
        await req.community.save();
        return res.status(200).json({message: "Joined community successfully"});
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

/**
 * @swagger
 * /communities/{communityId}/{userRequestedId}/decline-request:
 *   delete:
 *     summary: Decline a user's join request
 *     description: Allows a community admin to decline a user's request to join the community.
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         description: The ID of the community.
 *         schema:
 *           type: string
 *       - name: userRequestedId
 *         in: path
 *         required: true
 *         description: The ID of the user whose join request is being declined.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Join request declined successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Join request declined successfully
 *       400:
 *         description: User didn't request to join the community.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User didn't request to join the community
 *       403:
 *         description: Only admins can perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Only admins can do this action
 *       404:
 *         description: Community not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Community not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */
router.delete("/:communityId/:userRequestedId/decline-request", auth, verifyCommunityAdmin, async (req, res) =>{
    try {
        const {userRequestedId} = req.params;
        
        // Check if user actually requested to join
        const requested = req.community.joinRequests.includes(userRequestedId);
        if (!requested)
            return res.status(400).json({ message: "User didn't request to join the community" });

        // remove user from joinRequests 
        req.community.joinRequests = req.community.joinRequests.filter(
            id => id.toString() != userRequestedId
        );
        await req.community.save(); 
        return res.status(200).json({message: "Join request declined successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});
/**
 * @swagger
 * /communities/{communityId}/{userToRemoveId}:
 *   delete:
 *     summary: Remove a user from a community
 *     description: Allows a community admin to remove a member from the community.
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: communityId
 *         in: path
 *         required: true
 *         description: The ID of the community.
 *         schema:
 *           type: string
 *       - name: userToRemoveId
 *         in: path
 *         required: true
 *         description: The ID of the user to remove from the community.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User removed successfully
 *       400:
 *         description: The user is not a member of the community or invalid request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User isn't a member of the community
 *       403:
 *         description: Only community admins can perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Only admins can do this action
 *       404:
 *         description: Community not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Community not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */
router.delete("/:communityId/:userToRemoveId", auth, verifyCommunityAdmin, async (req, res) => {
    try {
        const {userToRemoveId} = req.params;
        
        if (req.userId === userToRemoveId)
            return res.status(400).json({message: "Admins cannot remove themselves"});

        // check if user is actually a member
        const isMember = req.community.members.some(id => id.equals(userToRemoveId));
        if (!isMember)
            return res.status(400).json({message: "User isn't a member of the community"});
        
        // remove user from members
        req.community.members = req.community.members.filter(
            id => id.toString() != userToRemoveId
        );
        req.community.memberCount -= 1;
        
        await req.community.save()
        return res.status(200).json({message: "User removed successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }
});

module.exports = router;