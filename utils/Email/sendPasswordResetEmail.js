const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
    const resetUrl = `${origin}/user/reset-password?token=${token}&email=${email}`;

    const message = `<h4>Hello ${name},
                    <p>Please reset your password by clicking on the following link: <a target="_blank" href="${resetUrl}" >Reset Password</a></p>`


    return sendEmail({
        to: email,
        subject: 'Reset Password',
        html: message
    })
}

module.exports = sendResetPasswordEmail;