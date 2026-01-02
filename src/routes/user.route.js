import {
  registerForm,
  verifyOTPAndRegisterUSer,
  loginForm,
  verifyOTPAndLoginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";

import { verifyJwt } from "../middleware/auth.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/register").post(registerForm);
router.route("/verify-otp-register").post(verifyOTPAndRegisterUSer);
router.route("/login").post(loginForm);
router.route("/verify-otp-login").post(verifyOTPAndLoginUser);

// proteceted routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-access-token").post(refreshAccessToken);

export default router;
