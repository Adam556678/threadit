const bcrypt = require("bcrypt");
const UserOTP = require("../models/UserOTP.js");
const nodemailer = require("nodemailer");


// Nodemailer
const transporter =  nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GOOGLE_PASS,
  },
});

// Function for sending an otp mail to the new users
const sendVerificationOTP = async ({_id, email}) => {
    try {
        // generate an OTP
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        // mail options
        const mailOptions = {
            from: process.env.GMAIL,
            to: email,
            subject: "Verify your Email",
            html: `<p>Your verification code is <b>${otp}</b>.</p>
            <p>This code expires in <b>1 hour</b></p>`
        }

        // hash the OTP and create its document
        const hashedOTP = await bcrypt.hash(otp, 10);
        await UserOTP.create({
            userId: _id,
            otp: hashedOTP,
            ExpiresAt: Date.now() + 3600000
        })

        // send mail to the user
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw new Error("Failed to send verification code");
    }
}

module.exports = sendVerificationOTP