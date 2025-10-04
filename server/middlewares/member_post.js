const Community = require("../models/Community")
const Post = require("../models/Post")

const memberPostMiddleware = async (req, res, next) => {
    const {postId} = req.params;

    try {
        // get post document
        const post = await Post.findById(postId);
        if (!post){
            return res.satus(404).json({message: "Post not found"});
        }
    
        // check if user is a member of posts's community
        const community = await Community.findOne({posts: postId});
        if (!community)
            return res.status(404).json({message: "Community not found"});
        const isMember = community.members.includes(req.userId);
        if (!isMember)
            return res.status(403).json({message: "user is not a member of the community"});
        
        req.community = community;
        req.post = post;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"})        
    }
}

module.exports = memberPostMiddleware;