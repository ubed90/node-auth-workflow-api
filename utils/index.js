const { createJWT, isTokenValid, attachCookiesToResponse } = require('./jwt');
const { sendEmail, sendVerificationEmail, sendResetPasswordEmail }  = require("./Email")
const createTokenUser = require('./createTokenUser');
const checkPermissions = require('./checkPermissions');
const hashString = require('./createHash');
module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  hashString
};
