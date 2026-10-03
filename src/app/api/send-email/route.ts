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
    try {
        const body = await req.json();

        await transporter.sendMail({
            from: `"HabitQuest" <${process.env.EMAIL_USER}>`,
            to: body.to,
            subject: body.subject,
            text: body.text,
            html: body.html
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Vercel Email Error:", error);
        return NextResponse.json({ error: "Failed to send email", details: error.message }, { status: 500 });
    }
}