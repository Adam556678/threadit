const bcrypt = require("bcrypt");

// Hash password
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Compare passwords
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash)
}

module.exports = {hashPassword, comparePassword};