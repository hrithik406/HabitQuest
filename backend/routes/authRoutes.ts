import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

const router = Router();

// Your secret key for signing tokens (In production, put this in a .env file!)
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_habit_key_123";

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

        // 1. Check if Email is already in use
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({ error: "Email already in use" });
            return;
        }

        // 2. Check if Username is already in use
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            res.status(400).json({ error: "Username is already taken" });
            return;
        }

        // 3. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new user with starter stats!
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            level: 1,
            gold: 0,
            xp: 0,
            xpProgress: { percentage: 0 },
            stats: { totalHabitsCompleted: 0, totalAchievements: 0, totalGoldSpent: 0, highestStreak: 0 }
        });

        // 5. Generate a JWT Token
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "30d" });

        // 6. Send back the token and user data (excluding the password!)
        const userResponse = newUser.toObject();
        delete (userResponse as any).password;

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during registration" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: "Please provide email and password" });
            return;
        }

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ error: "Invalid credentials" });
            return;
        }

        // 2. Check if the password matches the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ error: "Invalid credentials" });
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
        res.status(500).json({ error: "Server error during login" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // For security, don't reveal if the email exists or not
            res.status(200).json({ message: "If that email exists, a reset link has been sent." });
            return;
        }

        // 1. Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const expireDate = new Date(Date.now() + 15 * 60 * 1000);

        // 2. Directly update only the token fields in the database (bypasses full document validation)
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpire: expireDate
                }
            }
        );

        // 3. Create the reset URL (Points to your Next.js frontend!)
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        // 4. Setup Nodemailer (Using a free Ethereal test account for local dev)
        // NOTE: In production, you'd use a real service like Resend, SendGrid, or Gmail
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

        // 5. Send the email
        const info = await transporter.sendMail({
            from: '"HabitQuest Support" <support@habitquest.com>',
            to: user.email,
            subject: "Password Reset Request",
            html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password. This link is valid for 15 minutes.</p>
        <a href="${resetUrl}" target="_blank">Reset My Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.status(200).json({ message: "If that email exists, a reset link has been sent." });
    } catch (error) {
        console.log("Error sending reset email:", error);
        res.status(500).json({ error: "Email could not be sent" });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────
router.post("/reset-password/:token", async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Re-hash the token from the URL to compare it with our database
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        // 2. Find the user with this exact token, ensuring it hasn't expired
        // ⬇️ UPDATED TO new Date() ⬇️
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: new Date() },
        });

        if (!user) {
            res.status(400).json({ error: "Invalid or expired reset token" });
            return;
        }

        // 3. Hash the new password securely
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // 4. Clear the temporary reset tokens from the database so they can't be reused
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error during password reset" });
    }
});

export default router;