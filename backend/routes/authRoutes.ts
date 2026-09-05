import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

const router = Router();

// Your secret key for signing tokens (In production, put this in a .env file!)
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_habit_key_123";

// ── GMAIL TRANSPORTER ──
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ error: "Please fill in all fields" });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: "Invalid email format" });
            return;
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({ error: "Email already in use" });
            return;
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            res.status(400).json({ error: "Username is already taken" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verifyToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
        const expireDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = await User.create({
            username, email, password: hashedPassword,
            isVerified: false,
            verificationToken: hashedToken,
            verificationExpire: expireDate,
            level: 1, gold: 0, xp: 0, xpProgress: { percentage: 0 },
            stats: { totalHabitsCompleted: 0, totalAchievements: 0, totalGoldSpent: 0, highestStreak: 0 }
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verifyUrl = `${frontendUrl}/verify?token=${verifyToken}&email=${email}`;

        // 🚨 FIX 1: Removed 'await' so this runs in the background. Added .catch() for silent failures.
        transporter.sendMail({
            from: `"HabitQuest" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Here is your HabitQuest link!",
            text: `Welcome to HabitQuest, ${username}! Verify your account by pasting this link in your browser: ${verifyUrl}`,
            html: `
                <div style="text-align: center; font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to HabitQuest, ${username}!</h2>
                    <p>Click the button below to verify your account and jump into the game.</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                        Verify & Play
                    </a>
                </div>
            `
        }).catch(err => console.error("Background Email Error:", err));

        // Instantly reply to the frontend!
        res.status(201).json({ message: "Verification link sent to email", requiresVerification: true });
    } catch (error: any) {
        console.error("REGISTRATION ERROR:", error);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/verify-email
// ─────────────────────────────────────────────────────────────────
router.post("/verify-email", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, token } = req.body;

        // 🚨 FIX 2: Prevent Crypto from crashing if the frontend sends a blank request
        if (!email || !token) {
            res.status(400).json({ error: "Missing email or verification token." });
            return;
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            email,
            verificationToken: hashedToken,
            verificationExpire: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ error: "Invalid or expired verification link." });
            return;
        }

        // Clear the verification fields after successful verification.
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpire = null;
        await user.save();

        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(200).json({ message: "Verified!", token: jwtToken, user: userResponse });
    } catch (error) {
        // 🚨 FIX 4: Actually log the error so it isn't silent
        console.error("VERIFY ERROR:", error);
        res.status(500).json({ error: "Server error during verification" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/resend-verification (Magic Link version)
// ─────────────────────────────────────────────────────────────────
router.post("/resend-verification", async (req: Request, res: Response): Promise<void> => {
    try {
        const { username , email } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.isVerified) {
            res.status(400).json({ error: "User not found or already verified." });
            return;
        }

        // Generate a fresh URL token & 24-hour timer
        const verifyToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
        
        user.verificationToken = hashedToken;
        user.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verifyUrl = `${frontendUrl}/verify?token=${verifyToken}&email=${email}`;

        transporter.sendMail({
            from: `"HabitQuest" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Here is your HabitQuest link!", // Changed to look less like a robot
            text: `Welcome to HabitQuest, ${username}! Verify your account by pasting this link in your browser: ${verifyUrl}`, // 🚨 NEW: Plain text lowers spam score!
            html: `
                <div style="text-align: center; font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to HabitQuest, ${username}!</h2>
                    <p>Click the button below to verify your account and jump into the game.</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                        Verify & Play
                    </a>
                </div>
            `
        }).catch(err => console.error("Background Email Error:", err));

        res.status(200).json({ message: "A new magic link has been sent." });
    } catch (error) {
        res.status(500).json({ error: "Failed to resend link" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body; // Changed 'email' to 'identifier'

        if (!identifier || !password) {
            res.status(400).json({ error: "Please provide an email/username and password" });
            return;
        }

        // 1. Find the user by EITHER email OR username
        // .select("+password") is required if your User model hides passwords by default
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        }).select("+password");

        if (!user || !user.password) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        if (user.isVerified === false) {
            res.status(403).json({ error: "Please verify your email before logging in. Check your inbox!" });
            return;
        }

        // 2. Check if the password matches the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        // 3. Generate a JWT Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });

        // 4. Send back the token and user data
        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(200).json({
            message: "Login successful",
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/oauth (Social Login Sync)
// ─────────────────────────────────────────────────────────────────
router.post("/oauth", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, username, provider } = req.body;

        // 1. Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // 2. If new, create an account automatically
            // Generate a random dummy password since they use OAuth
            const dummyPassword = crypto.randomBytes(20).toString('hex');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(dummyPassword, salt);

            // Remove spaces and add random numbers to ensure a unique username
            const uniqueUsername = username.replace(/\s+/g, '') + Math.floor(Math.random() * 10000);

            user = await User.create({
                email,
                username: uniqueUsername,
                password: hashedPassword,
                level: 1,
                gold: 0,
                xp: 0,
                xpProgress: { percentage: 0 },
                stats: { totalHabitsCompleted: 0, totalAchievements: 0, totalGoldSpent: 0, highestStreak: 0 }
            });
        }

        res.status(200).json({ message: "OAuth sync successful", user });
    } catch (error) {
        console.error("OAUTH ERROR:", error);
        res.status(500).json({ error: "Failed to sync OAuth user" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password (OTP Flow)
// ─────────────────────────────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(200).json({ message: "If that email exists, an OTP has been sent." });
            return;
        }

        // 1. Generate a 6-digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expireDate = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

        // 2. Directly update only the token fields in the database
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: otp,
                    resetPasswordExpire: expireDate
                }
            }
        );

        // 3. Setup Nodemailer (Using Ethereal for local dev)
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        // 4. Send the OTP email
        const info = await transporter.sendMail({
            from: '"HabitQuest Support" <support@habitquest.com>',
            to: user.email,
            subject: "Your Password Reset OTP",
            html: `
        <h2>Password Reset</h2>
        <p>Your password reset OTP is: <strong>${otp}</strong></p>
        <p>This code is valid for 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.status(200).json({ message: "If that email exists, an OTP has been sent." });
    } catch (error) {
        console.log("Error sending reset email:", error);
        res.status(500).json({ error: "Email could not be sent" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password (OTP Verification)
// ─────────────────────────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, password } = req.body;

        // 1. Find the user with this email AND a valid, unexpired OTP
        const user = await User.findOne({
            email: email,
            resetPasswordToken: otp,
            resetPasswordExpire: { $gt: new Date() },
        });

        if (!user) {
            res.status(400).json({ error: "Invalid or expired OTP" });
            return;
        }

        // 2. Hash the new password securely
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 3. Clear the OTP from the database so it can't be reused
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("OTP RESET ERROR:", error);
        res.status(500).json({ error: "Server error during password reset" });
    }
});

export default router;