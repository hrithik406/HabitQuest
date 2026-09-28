"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";
import { getItemIcon } from "@/../shared/item"; 
import PowerupIndicator from "./PowerupIndicator"; 
import { signOut } from "next-auth/react";

export default function TopHeader() {
  const { user } = useApp();
  const pathname = usePathname();
  
  // 1. Dropdown State and Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 2. Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide on profile page
  if (pathname === "/profile") return null;

  // Render a skeleton if user isn't loaded
  if (!user) return <div className="h-16 w-full border-b border-slate-800 bg-slate-950/80" />;

  return (
    <header className="max-lg:hidden sticky top-0 z-40 w-full h-16 flex items-center justify-end px-4 md:px-8 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">

      {/* Active Powerups */}
      {user.activePowerups && user.activePowerups.length > 0 && (
        <div className="flex items-center gap-2.5 mr-6 border-r border-slate-800 pr-6 h-10">
          {user.activePowerups.map((pu) => (
            <PowerupIndicator
              key={pu.itemId}
              itemId={pu.itemId}
              expiresAt={pu.expiresAt}
            />
          ))}
        </div>
      )}

      {/* 3. NEW DROPDOWN CONTAINER */}
      <div className="relative" ref={dropdownRef}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1 pr-2 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
              {user.username || "Player"}
            </p>
            <p className="text-xs font-bold text-yellow-500">
              Lvl {user.level || 1}
            </p>
          </div>

          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500/50 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(124,58,237,0.2)] group-hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-shadow"
          >
            {getItemIcon(user.activeAvatar)}
          </motion.div>

          {/* 4. Dropdown Arrow Indicator */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-violet-400' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>

        {/* 5. Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50">
            {/* Profile Link */}
            <Link 
              href="/profile" 
              onClick={() => setIsDropdownOpen(false)}
              className="px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors border-b border-slate-800 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            
            {/* Logout Button */}
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}