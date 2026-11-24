"use client";

import React, { useState, useEffect } from 'react';

export default function EvilLoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedAccent, setSelectedAccent] = useState('red');

  const accentPalettes = {
    red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
  };

  const activePalette = accentPalettes[selectedAccent] || accentPalettes.red;
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

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('isDarkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }
    const savedAccent = localStorage.getItem('selectedAccent');
    if (savedAccent) {
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

  const handleAuth = (e) => {
    e.preventDefault();
    // Simulasi Open Redirect landing page (tanpa pengambilan/pengiriman kredensial ke backend)
    setErrorMsg("Open Redirect Simulation (link.evil): Form submitted on spoofed page. No credentials were captured or transmitted.");
  };

  return (
    <div 
      className={`flex items-center justify-center h-screen bg-gray-100 transition-colors duration-300 ${isDarkMode ? 'dark:bg-[#121212]' : ''}`}
      style={themeVars}
    >
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-96 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="h-32 bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center relative">
          <h2 className="text-3xl font-black tracking-tight drop-shadow-md">
            I/O Chat
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
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
              required 
            />
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Username" 
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
                required 
              />
            )}
            <input 
              type="password" 
              placeholder="Password" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
              required 
            />
            <button 
              type="submit" 
              className="w-full py-3.5 text-white bg-red-600 hover:bg-red-700 font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <p 
            className="mt-6 text-sm text-center text-red-600 hover:text-red-700 font-bold cursor-pointer transition-all hover:underline" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    </div>
  );
}
