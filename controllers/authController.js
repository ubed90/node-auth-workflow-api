const User = require("../models/User");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  hashString
} = require("../utils");
const crypto = require("crypto");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const verificationToken = crypto.randomBytes(40).toString("hex");
  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });

  // * Removed For Auth workflow
  // const tokenUser = createTokenUser(user);
  // attachCookiesToResponse({ res, user: tokenUser });
  // res.status(StatusCodes.CREATED).json({ user: tokenUser });

  // ! Previous Functionality to test with Postman
  // res.status(StatusCodes.OK).json({ msg: "Success! Please check your email to verify account.", verificationToken: user.verificationToken })

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin: "http://localhost:3000",
  });
  res
    .status(StatusCodes.OK)
    .json({ msg: "Success! Please check your email to verify account." });
};

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  const user = await User.findOne({ email });

  if (!user && verificationToken !== user.verificationToken) {
    throw new CustomError.UnauthenticatedError(`Verification Failed`);
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";

  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Email Verified" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  if (!user.isVerified) {
    throw new CustomError.BadRequestError("Please verify your email");
  }

  const tokenUser = createTokenUser(user);

  // * Refresh Token
  let refreshToken = '';

  // * Check for existing Token
  // const existingToken = await Token.findOne({ user: user._id });

  // if(existingToken) {
  //   const { isValid } = existingToken;

  //   if(!isValid) {
  //     throw new CustomError.UnauthenticatedError("Invalid Credentials");
  //   }

  //   refreshToken = existingToken.refreshToken;

  //   attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  //   return res.status(StatusCodes.OK).json({ user: tokenUser });
  // }


  refreshToken = crypto.randomBytes(40).toString('hex');
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;

  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  // ! Need to attach refresh Token Functionality
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  return res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId, refreshToken: req.token });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email.");
  }

  const user = await User.findOne({ email });

  if(!user) {
    throw new CustomError.BadRequestError(`No user with email: ${email}`);
  }

  const passwordToken = crypto.randomBytes(70).toString('hex');
  const passwordTokenExpirationDate = new Date(Date.now() + 1000 * 60 * 10); // * 10 Minute

  await sendResetPasswordEmail({ name: user.name, email: user.email, token: passwordToken, origin: "http://localhost:3000" })

  user.passwordToken = hashString(passwordToken);
  user.passwordTokenExpirationDate = passwordTokenExpirationDate;

  await user.save();


  res.status(StatusCodes.OK).json({ msg: "Please check your email for password reset link" });
}

const resetPassword = async (req, res) => {
  const { password, token, email } = req.body;

  if (!email || !password || !email) {
    throw new CustomError.BadRequestError("Please provide all values.");
  };

  const user = await User.findOne({ email });

  // * We will send 200 with the email, if user is not available in DB - Coz we dont need to expose attackers if an email exists in our DB
  if(user) {
    const currentDate = new Date();

    console.log(user.passwordToken , token);

    if(user.passwordToken === hashString(token) && user.passwordTokenExpirationDate > currentDate) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }

  res.status(200).json({ email });
}

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
};
