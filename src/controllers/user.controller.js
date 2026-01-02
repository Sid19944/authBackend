import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ExpressError } from "../utils/ExpressError.js";
import { Otp } from "../models/otp.model.js";
// import { sendMail } from "../utils/mail/sendMail.js";
import { sendOTPMail } from "../utils/mail/usingResend/sendOTP.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (email) => {
  try {
    const user = await User.findOne({ email });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ExpressError(
      400,
      {},
      `Something went while generating TOKENS, ${err.message}`
    );
  }
};

const cookieOption = {
  httpOnly: true,
  secure: true,
};

const registerForm = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ExpressError(400, {}, "All field are required");
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    throw new ExpressError(400, {}, "User already Registered");
  }

  await Otp.deleteMany({ email });
  const OTP = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const resp = await sendOTPMail(email, OTP); // send otp to user's mailId
  

  const otp = await Otp.create({
    otp: OTP,
    email: email.toLowerCase(),
    expiresAt,
  });

  return res.status(200).json({
    message: `OTP send successfuly to ${email.toLowerCase()}, valid for 5 minute`,
    success: true,
  });
});

const verifyOTPAndRegisterUSer = asyncHandler(async (req, res) => {
  const { fullName, username, password, email, otp } = req.body;
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ExpressError(400, {}, "All field are required");
  }
  if (!(email || otp)) {
    throw new ExpressError(400, {}, "please enter email and otp");
  }

  const findOtp = await Otp.findOne({ email: email.toLowerCase() });
  if (!findOtp) {
    throw new ExpressError(400, {}, "Otp not sended please resend the OTP");
  }

  if (findOtp.otp !== otp) {
    // throw new ExpressError(400, {}, `Invalid OTP or OTP Expires `);
    return res.json({ message: "Invalid OTP", success: false });
  }

  await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    isVerified: true,
  });

  await Otp.deleteMany({ email: email.toLowerCase() });

  return res
    .status(200)
    .json({ message: "User Registered Successfully", success: true });
});

const loginForm = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!(email || password)) {
    throw new ExpressError(400, {}, "Invalid input");
  }
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    throw new ExpressError(
      400,
      {},
      `User not registered with ${email?.toLowerCase()}`
    );
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ExpressError(400, {}, `Invalid password`);
  }

  await Otp.deleteMany({ email });
  const OTP = Math.floor(Math.random() * 1000000).toString();
  const expiresAt = Math.floor(Math.random() * 1000000).toString();
  await sendOTPMail(email, OTP); // send otp to user's mailId

  const otp = await Otp.create({
    otp: OTP,
    email: email.toLowerCase(),
    expiresAt,
  });

  return res.status(200).json({
    message: `OTP send Successfully to ${email.toLowerCase()}, valid for 5 minute`,
  });
});

const verifyOTPAndLoginUser = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!(email || otp)) {
    throw new ExpressError(400, {}, `All field are required`);
  }

  const findOtp = await Otp.findOne({ email: email?.toLowerCase() });
  if (!findOtp) {
    throw new ExpressError(400, {}, `OTP not sended, please resend the OTP`);
  }

  if (findOtp.otp !== otp) {
    throw new ExpressError(400, {}, `Invalid OTP Try again`);
  }

  await Otp.deleteMany({ email: email?.toLowerCase() });
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    email?.toLowerCase()
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: `User Login Successfully`,
      success: true,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1,
    },
  });

  return res
    .status(200)
    .clearCookie("Token", cookieOption)
    .clearCookie("RefreshToken", cookieOption)
    .clearCookie("accessToken", cookieOption)
    .clearCookie("refreshToken", cookieOption)
    .json({ message: "User seccessfully Logout", success: true });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req?.cookies?.refreshToken || req?.body?.refreshToken;

  if (!incommingRefreshToken) {
    throw new ExpressError(
      400,
      {},
      `Unauthorized Request, You don't have Refresh Token`
    );
  }

  try {
    const decodedRefreshToken = await jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedRefreshToken) {
      throw new ExpressError(400, {}, "Invalid Refresh Token");
    }

    const user = await User.findById(decodedRefreshToken?._id).select(
      "-password"
    );
    if (!user) {
      throw new ExpressError(400, {}, "Expired Token or Invalid Token");
    }

    const accessToken = await user.generateAccessToken();

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOption)
      .json({
        accessToken: accessToken,
        message: "Access Token successfully Refreshed",
        success: true,
      });
  } catch (err) {
    throw new ExpressError(
      400,
      {},
      `Error while refresing the access Token, ${err.message}`
    );
  }
});

export {
  registerForm,
  verifyOTPAndRegisterUSer,
  loginForm,
  verifyOTPAndLoginUser,
  logoutUser,
  refreshAccessToken,
};
