"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLogin, setIsLogin] = useState(true);

    useEffect(() => {
        if (searchParams.get("mode") === "signup") {
            setIsLogin(false);
        }
    }, [searchParams]);

    useEffect(() => {
        window.history.pushState(null, "", window.location.href);
        const handleBackButton = () => {
            router.replace("/");
        };
        window.addEventListener("popstate", handleBackButton);
        return () => window.removeEventListener("popstate", handleBackButton);
    }, [router]);

    const [identifier, setIdentifier] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [username, setUsername] = useState(""); 
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ── TIMER STATES ──
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (successMsg && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0) {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [successMsg, countdown]);

    const handleResendEmail = async () => {
        setCanResend(false);
        setCountdown(60);
        try {
            await fetch("http://localhost:5000/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
        } catch (err) {
            console.error("Resend error:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setIsLoading(true);

        if (!isLogin) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError("Please enter a valid email address.");
                setIsLoading(false);
                return;
            }
        }

        try {
            if (isLogin) {
                const res = await signIn("credentials", {
                    redirect: false,
                    identifier,
                    password,
                });

                if (res?.error) {
                    setError(res.error);
                    setIsLoading(false);
                    return;
                }
                router.push("/dashboard");

            } else {
                const res = await fetch("http://localhost:5000/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Registration failed");
                    setIsLoading(false);
                    return;
                }

                if (data.requiresVerification) {
                    setSuccessMsg("Account created! 💌 We've sent a magic link to your inbox.");
                    setCountdown(60);
                    setCanResend(false);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error("FULL ERROR:", err);
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 border-2 border-violet-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                        {successMsg ? "✉️" : "⚔️"}
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        {successMsg ? "Check Your Email" : (isLogin ? "Welcome Back" : "Begin Your Journey")}
                    </h1>
                    {!successMsg && (
                        <p className="text-slate-400 mt-2 text-sm">
                            {isLogin ? "Ready to crush your habits today?" : "Create an account to track your progress and level up."}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold text-center animate-pulse">
                        {error}
                    </div>
                )}

                {/* ── SUCCESS UI (REPLACES FORM) ── */}
                {successMsg ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold">
                            {successMsg}
                        </div>
                        
                        <a 
                            href="https://mail.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 font-black py-3.5 rounded-xl transition-all active:scale-95"
                        >
                            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                            Open Gmail
                        </a>

                        <div className="pt-4 border-t border-slate-800">
                            {canResend ? (
                                <button 
                                    onClick={handleResendEmail}
                                    className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    Resend Verification Email
                                </button>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    Resend email in <span className="font-bold text-slate-300">{countdown}s</span>
                                </p>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* ── STANDARD FORM & SOCIAL BUTTONS ── */
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                                            <input
                                                type="text"
                                                required={!isLogin}
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                                placeholder="HeroName123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                            <input
                                                type="email"
                                                required={!isLogin}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                                placeholder="player@habit.com"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isLogin && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email or Username</label>
                                    <input
                                        type="text"
                                        required={isLogin}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        placeholder="player@habit.com or HeroName"
                                    />
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Password
                                    </label>
                                    {isLogin && (
                                        <Link href="/forgot-password" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3.5 rounded-xl mt-6 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? "Log In" : "Create Account")}
                            </button>
                        </form>

                        <div className="mt-6">
                            <div className="relative flex items-center justify-center mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative px-4 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Or continue with
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                                    className="flex items-center justify-center py-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all"
                                >
                                    <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                                    className="flex items-center justify-center py-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all"
                                >
                                    <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" className="w-5 h-5 invert" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-sm text-slate-400">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError("");
                                }}
                                className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                {isLogin ? "Sign Up" : "Log In"}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center" />}>
            <LoginContent />
        </Suspense>
    );
}