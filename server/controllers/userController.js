import User from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import sendEmail from "../config/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import jwt from "jsonwebtoken";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import generatedAccessToken from "../models/generatedAccessToken.js";
import generatedRefreshToken from "../models/generatedRefreshToken.js";

export const registerUser = catchAsyncErrors(async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
        error: true,
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        message: "Email already exist",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const emailResponse = await sendEmail({
      sendTo: email,
      subject: "Verify Your Email - Faith & Fast",
      html: verifyEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });

    if (!emailResponse) {
      return res.status(500).json({
        message: "Failed to send verification email",
        error: true,
        success: false,
      });
    }

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      isVerified: false,
    });

    const savedUser = await newUser.save();

    if (!savedUser) {
      return res.status(500).json({
        message: "Failed to create user",
        error: true,
        success: false,
      });
    }

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      error: false,
      success: true,
      data: savedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error. Please try again.",
      error: true,
      success: false,
    });
  }
});

export const verifyEmailController = catchAsyncErrors(async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Verification code is required",
        error: true,
        success: false,
      });
    }

    const user = await User.findById(code);

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification code",
        error: true,
        success: false,
      });
    }

    if (user.verifyEmail) {
      return res.status(400).json({
        message: "Email is already verified",
        error: true,
        success: false,
      });
    }

    user.verifyEmail = true;
    await user.save();

    return res.status(200).json({
      message: "Email successfully verified",
      success: true,
      error: false,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
});

export const loginUser = catchAsyncErrors(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
        error: true,
        success: false,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User is not registered",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return res.status(400).json({
        message: "Your account is not active. Please contact the admin.",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return res.status(400).json({
        message: "Incorrect password",
        error: true,
        success: false,
      });
    }

    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await generatedRefreshToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      // secure: process.env.NODE_ENV === "production", 
      // sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };
    res.cookie("accessToken", accessToken, cookiesOption);
    res.cookie("refreshToken", refreshToken, cookiesOption);

    return res.status(200).json({
      message: "Login successful",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
});
