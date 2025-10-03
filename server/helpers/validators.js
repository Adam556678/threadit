const validator = require("validator");

// Email validator
function isValidEmail(email) {
    return validator.isEmail(email);
}

// Password validator
function isStrongPassword(password){
    return validator.isStrongPassword(password, {
        minLength: 8, 
        minLowercase: 1,
        minUppercase: 1,
        minSymbols: 0        
    });
}

function isvalidPhoneNum(phoneNum){
    return validator.isMobilePhone(phoneNum);
}

module.exports = {isValidEmail, isStrongPassword, isvalidPhoneNum}