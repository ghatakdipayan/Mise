import React, { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';

interface AuthScreenProps {
  onSignIn: (provider: string, userProfile: { name: string; email: string; avatar: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    setNoticeMsg(null);

    // 1. If Firebase is configured, use real Firebase Auth!
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let result;

        if (isMobile) {
          console.log('Mobile device detected. Using signInWithRedirect.');
          await signInWithRedirect(auth, googleProvider);
          return; // Stop execution, page is redirecting
        }

        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          console.warn('Popup authentication failed, attempting redirect fallback:', popupError);
          if (
            popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request'
          ) {
            await signInWithRedirect(auth, googleProvider);
            return; // Stop execution, page is redirecting
          } else {
            throw popupError;
          }
        }

        const user = result.user;

        const name = user.displayName || 'Google User';
        const email = user.email || '';

        // Safe initials extraction to prevent crashes with empty or double spaces
        const initials = name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'U';

        onSignIn('google', { name, email, avatar: initials });
      } catch (error: any) {
        console.error('Firebase authentication failed:', error);
        setNoticeMsg(error.message || 'Failed to authenticate via Google. Please check your console.');
      } finally {
        setLoadingProvider(null);
      }
      return;
    }

    // 2. If Firebase is not configured, show a visual warning notice and fall back to mock data
    setNoticeMsg('Firebase credentials not detected in .env file. Falling back to simulated login mode.');

    // Simulated auth delay
    setTimeout(() => {
      onSignIn('google', { name: 'Jordan Morris', email: 'jordan.morris@gmail.com', avatar: 'JM' });
      setLoadingProvider(null);
    }, 1400);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-[#e8efe6] via-[#fbf7f0] to-[#f4f7f3] p-4 relative overflow-hidden select-none">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-100/60 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-100/50 blur-[90px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-15%] w-[300px] h-[300px] rounded-full bg-teal-100/40 blur-[70px] pointer-events-none" />

      {/* Glassmorphism Card Wrapper */}
      <div className="w-full max-w-[420px] bg-white/70 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 md:p-10 shadow-[0_24px_60px_-15px_rgba(21,168,91,0.08)] flex flex-col items-center relative z-10 animate-fade-in">
        {/* App Logo */}
        <div className="w-[84px] h-[84px] rounded-2xl bg-white flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.04)] mb-5 border border-solid border-[#eceeea] hover:scale-105 transition-all">
          <img src="/icon-192.png" className="w-[62px] h-[62px] rounded-xl" alt="Mise Logo" />
        </div>

        {/* Brand/Title Header */}
        <span className="font-head text-4xl font-extrabold tracking-tight text-[#15201a]">
          Mise
        </span>
        <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#15a85b] mt-1">
          Your Smart Sous-Chef
        </span>

        {/* Headline */}
        <p className="text-center text-[15px] leading-relaxed text-[#717c75] mt-5 mb-6 max-w-[280px]">
          Cook meals with what you already have, reduce food waste, and plan your week.
        </p>

        {/* Notice Info Banner */}
        {noticeMsg && (
          <div className="w-full bg-amber-50 border border-solid border-amber-200 text-amber-800 p-3.5 rounded-2xl text-[12.5px] leading-relaxed mb-6 text-center animate-fade-in">
            <span className="font-bold">Developer Notice:</span> {noticeMsg}
          </div>
        )}

        {/* Social login buttons block */}
        <div className="w-full flex flex-col gap-3.5">
          {/* Google Button */}
          <button
            disabled={loadingProvider !== null}
            onClick={handleGoogleLogin}
            className={`w-full h-13 border border-solid border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 font-semibold text-[15px] rounded-2xl cursor-pointer flex items-center justify-center gap-3 transition-all ${
              loadingProvider !== null ? 'opacity-50 cursor-not-allowed' : 'shadow-sm'
            }`}
          >
            {loadingProvider === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.24-.63-.35-1.3-.35-2.09z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Info Privacy Footer */}
        <div className="text-[11.5px] text-[#9aa39c] text-center mt-7 leading-relaxed">
          By continuing, you agree to Mise's <span className="underline hover:text-[#717c75] cursor-pointer">Terms of Service</span> and <span className="underline hover:text-[#717c75] cursor-pointer">Privacy Policy</span>.
        </div>
      </div>
    </div>
  );
};
