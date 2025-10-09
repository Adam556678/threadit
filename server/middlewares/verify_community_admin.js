const Community = require("../models/Community");

const verifyCommunityAdmin = async (req, res, next) => {
    try {
        const {communityId} = req.params;

        // get community document
        const community = await Community.findById(communityId);
        if (!community)
            return res.status(404).json({message: "Community not found"});

        // check if user is an Admin
        const isAdmin = community.admins.some(id => id.equals(req.userId));
        if (!isAdmin)
            return res.status(403).json({message: "Only admins can do this action"});

        req.community = community;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Something went wrong"});
    }

};

module.exports = verifyCommunityAdmin;