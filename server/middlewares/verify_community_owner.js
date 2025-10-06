const Community = require("../models/Community");

const verifyCommunityOwner = async (req, res, next) => {
    try {
        const {communityId} = req.params;

        // get community document
        const community = await Community.findById(communityId);
        if (!community)
            return res.status(404).json({message: "Community not found"});

        // check if user is owner
        if (!community.owner.equals(req.userId))
            return res.status(403).json({message: "Owner can only delete community"});

        req.community = community;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

};

module.exports = verifyCommunityOwner;