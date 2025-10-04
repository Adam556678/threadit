const Community = require("../models/Community.js");

// A middleware to check if a user is actually joined to the comunity
const joined = async(req, res, next) => {
    const {communityId} = req.params;

    try {
        // get community data
        const community = await Community.findById(communityId)
        if (!community)
            return res.status(404).json({message: "Community not found"});

        // check if user joined
        const isMember = community.members.includes(req.userId);
        if (!isMember) 
            return res.status(403).json({message: "user is not a member of the community"});

        req.community = community;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }  
};

module.exports = joined;