import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function POST(req: Request) {
    console.log("🟢 NEXT.JS: Received email request!");
    try {
        const body = await req.json();
        console.log("🟢 NEXT.JS: Email target:", body.to);
        console.log("🟢 NEXT.JS: Credentials check - User:", process.env.EMAIL_USER ? "FOUND" : "MISSING");

        await transporter.sendMail({
            from: `"HabitQuest" <${process.env.EMAIL_USER}>`,
            to: body.to,
            subject: body.subject,
            text: body.text,
            html: body.html
        });

        console.log("🟢 NEXT.JS: Email sent successfully to Gmail!");
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("🔴 NEXT.JS: Vercel Email Error:", error);
        return NextResponse.json({ error: "Failed to send email", details: error.message }, { status: 500 });
    }
}