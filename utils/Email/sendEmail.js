const nodemailer = require("nodemailer");
const nodemailerConfig = require("./nodemailerConfig");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = new nodemailer.createTransport(nodemailerConfig);

  return transporter.sendMail({
    from: '"Admin - Ubed 👻" <admin@gmail.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    text: "Hello world?", // plain text body
    html, // html body
  });
};

module.exports = sendEmail;
