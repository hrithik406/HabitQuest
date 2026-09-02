"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Verifying your account...");
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            setStatus("Invalid verification link.");
            setError(true);
            return;
        }

        // Trigger NextAuth using our custom "verify" action
        signIn("credentials", {
            redirect: false,
            action: "verify",
            email: email,
            token: token
        }).then((res) => {
            if (res?.error) {
                setStatus("Link expired or invalid. Please try registering again.");
                setError(true);
            } else if (res?.ok) {
                setStatus("Account Verified! Entering the game...");
                // Automatically drop them into the dashboard!
                setTimeout(() => router.push("/dashboard"), 1500);
            }
        });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full"
            >
                {!error && (
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-6" />
                )}
                <h1 className={`text-xl font-bold ${error ? "text-red-400" : "text-white"}`}>
                    {status}
                </h1>
                {error && (
                    <button onClick={() => router.push("/login")} className="mt-6 text-violet-400 font-bold hover:text-violet-300">
                        Return to Login
                    </button>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <VerifyContent />
        </Suspense>
    );
}