const sendEmail = require("./sendEmail");
const sendVerificationEmail = require("./sendVerificationEmail");
const sendResetPasswordEmail = require("./sendPasswordResetEmail");

module.exports = { sendEmail, sendVerificationEmail, sendResetPasswordEmail };