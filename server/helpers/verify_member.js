const Post = require("../models/Post.js");

// middleware to check if the voter is joined in post/comment's community
const verifyCommunityMember = async (req, res, next) => {
  try {
    const { targetId, targetType } = req.body; 

    let community;

    if (targetType === "Post") {
      // Find post and its community
      const post = await Post.findById(targetId).populate("community");
      if (!post || !post.community)
        return res.status(404).json({ message: "Post or community not found" });

      community = post.community;
    } 
    else if (targetType === "Comment") {
      // Find comment, then find post containing it, then community
      const post = await Post.findOne({ comments: targetId }).populate("community");
      if (!post || !post.community)
        return res.status(404).json({ message: "Post or community not found" });

      community = post.community;
    } 
    else {
      return res.status(400).json({ message: "Invalid target type" });
    }

    // Check if user is a member of that community
    const isMember = community.members.some(m => m.equals(req.userId));
    if (!isMember)
      return res.status(403).json({ message: "You are not a member of this community" });

    req.community = community;
    next();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = verifyCommunityMember;