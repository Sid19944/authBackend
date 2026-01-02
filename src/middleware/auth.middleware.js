import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ExpressError } from "../utils/ExpressError.js";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    // console.log(req.cookies);
    const token =
      req?.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new ExpressError(400, {}, "Unauthorized request, Please Login");
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ExpressError(400, {}, "Error while decoding the access token");
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ExpressError(400, {}, "Invalid Access Token ID");
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    throw new ExpressError(400, {}, error.message);
  }
});

export { verifyJwt };
