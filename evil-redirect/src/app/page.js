"use client";

import React, { useState, useEffect } from 'react';

/**
 * Salinan visual halaman login/register I/O Chat.
 * Halaman ini tidak melakukan redirect ke mana pun: browser berhenti di sini
 * sebagai bukti eksploitasi. Form tidak mengirim kredensial.
 */

const accentPalettes = {
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
};

export default function EvilLoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('blue');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Samakan tema dengan halaman I/O Chat asli.
    const savedDarkMode = localStorage.getItem('isDarkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }

    const savedAccent = localStorage.getItem('selectedAccent');
    if (savedAccent && accentPalettes[savedAccent]) {
      setSelectedAccent(savedAccent);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activePalette = accentPalettes[selectedAccent] || accentPalettes.blue;
  const themeVars = {
    '--app-accent-50': activePalette[50],
    '--app-accent-100': activePalette[100],
    '--app-accent-200': activePalette[200],
    '--app-accent-300': activePalette[300],
    '--app-accent-400': activePalette[400],
    '--app-accent-500': activePalette[500],
    '--app-accent-600': activePalette[600],
    '--app-accent-700': activePalette[700],
    '--app-accent-800': activePalette[800],
    '--app-accent-900': activePalette[900],
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setErrorMsg("Demo only — kredensial tidak dikirim dan halaman tetap di sini.");
  };

  return (
    <div
      className={`flex items-center justify-center h-screen bg-gray-100 transition-colors duration-300 ${isDarkMode ? 'dark:bg-[#121212]' : ''}`}
      style={themeVars}
    >
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-96 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="h-32 bg-blue-600 flex flex-col items-center justify-center p-6 text-white text-center relative">
          <h2 className="text-3xl font-black tracking-tight drop-shadow-md">
            I/O Chat EVILLL
          </h2>
          <p className="text-sm font-medium text-white/95 mt-1">
            {isLogin ? "Welcome back!" : "Create an account"}
          </p>
        </div>
        <div className="p-8">
          {errorMsg && <p className="mb-4 text-sm text-red-500 font-semibold">{errorMsg}</p>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3.5 text-white bg-blue-600 hover:bg-blue-700 font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              {isLogin ? "we luv your data" : "Register"}
            </button>
          </form>
          <p
            className="mt-6 text-sm text-center text-blue-600 hover:text-blue-700 font-bold cursor-pointer transition-all hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    </div>
  );
}
