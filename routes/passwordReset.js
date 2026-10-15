
const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

// Temporary OTP storage
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// STEP 1: Send OTP to admin email
router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "").trim().toLowerCase();

    if (!email || role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Valid admin email is required",
      });
    }

    const [users] = await db.execute(
      "SELECT id, email FROM users WHERE LOWER(email) = ? AND LOWER(role) = 'admin' LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    otpStore.set(email, {
      otpHash,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Spice App - Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    });

    return res.json({
      success: true,
      message: "OTP sent to your admin email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please try again.",
    });
  }
});

// STEP 2: Verify OTP and update admin password
router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || role !== "admin" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and 6-digit OTP",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const savedOtp = otpStore.get(email);

    if (!savedOtp) {
      return res.status(400).json({
        success: false,
        message: "Request a new OTP",
      });
    }

    if (Date.now() > savedOtp.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new OTP",
      });
    }

    if (savedOtp.attempts >= 5) {
      otpStore.delete(email);
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new OTP",
      });
    }

    const submittedHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (submittedHash !== savedOtp.otpHash) {
      savedOtp.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    const [users] = await db.execute(
      "SELECT id FROM users WHERE LOWER(email) = ? AND LOWER(role) = 'admin' LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      otpStore.delete(email);
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, users[0].id]
    );

    otpStore.delete(email);

    return res.json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again.",
    });
  }
});

module.exports = router;
