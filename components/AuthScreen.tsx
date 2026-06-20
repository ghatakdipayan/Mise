import React, { useState } from 'react';

interface AuthScreenProps {
  onSignIn: (provider: string, userProfile: { name: string; email: string; avatar: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialLogin = (provider: string) => {
    setLoadingProvider(provider);
    
    // Simulate API authorization response delay
    setTimeout(() => {
      let name = 'Jordan Morris';
      let email = 'jordan.morris@gmail.com';
      let avatar = 'JM';

      if (provider === 'google') {
        name = 'Jordan Morris';
        email = 'jordan.morris@gmail.com';
        avatar = 'JM';
      } else if (provider === 'facebook') {
        name = 'Alex Rivera';
        email = 'alex.rivera@fb.com';
        avatar = 'AR';
      } else if (provider === 'instagram') {
        name = 'Taylor Smith';
        email = 'taylor.smith@insta.com';
        avatar = 'TS';
      } else if (provider === 'tiktok') {
        name = 'Sam Chen';
        email = 'sam.chen@tiktok.com';
        avatar = 'SC';
      }

      onSignIn(provider, { name, email, avatar });
      setLoadingProvider(null);
    }, 1200);
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
          <img src="/icon-192.png" className="w-[62px] h-[62px] rounded-xl" alt="PantryPal Logo" />
        </div>

        {/* Brand/Title Header */}
        <span className="font-head text-4xl font-extrabold tracking-tight text-[#15201a]">
          PantryPal
        </span>
        <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#15a85b] mt-1">
          Your Smart Sous-Chef
        </span>

        {/* Headline */}
        <p className="text-center text-[15px] leading-relaxed text-[#717c75] mt-5 mb-8 max-w-[280px]">
          Cook meals with what you already have, reduce food waste, and plan your week.
        </p>

        {/* Social login buttons block */}
        <div className="w-full flex flex-col gap-3.5">
          {/* Google Button */}
          <button
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin('google')}
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

          {/* Facebook Button */}
          <button
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin('facebook')}
            className={`w-full h-13 bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-semibold text-[15px] rounded-2xl border-none cursor-pointer flex items-center justify-center gap-3 transition-all ${
              loadingProvider !== null ? 'opacity-50 cursor-not-allowed' : 'shadow-sm'
            }`}
          >
            {loadingProvider === 'facebook' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-[22px] h-[22px] flex-none" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            <span>{loadingProvider === 'facebook' ? 'Connecting to Facebook...' : 'Continue with Facebook'}</span>
          </button>

          {/* Instagram Button */}
          <button
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin('instagram')}
            style={{
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
            }}
            className={`w-full h-13 active:scale-[0.98] text-white font-semibold text-[15px] rounded-2xl border-none cursor-pointer flex items-center justify-center gap-3 transition-all ${
              loadingProvider !== null ? 'opacity-50 cursor-not-allowed' : 'shadow-md'
            }`}
          >
            {loadingProvider === 'instagram' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-none" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            )}
            <span>{loadingProvider === 'instagram' ? 'Connecting to Instagram...' : 'Continue with Instagram'}</span>
          </button>

          {/* TikTok Button */}
          <button
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin('tiktok')}
            className={`w-full h-13 bg-black hover:bg-zinc-900 active:scale-[0.98] text-white font-semibold text-[15px] rounded-2xl border-none cursor-pointer flex items-center justify-center gap-3 transition-all ${
              loadingProvider !== null ? 'opacity-50 cursor-not-allowed' : 'shadow-md shadow-black/10'
            }`}
          >
            {loadingProvider === 'tiktok' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-[18px] h-[18px] flex-none" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.08-1.39a8.67 8.67 0 01-1.89-1.92v6.52c.07 2.11-.7 4.29-2.28 5.76-1.57 1.54-3.87 2.22-6.05 1.94-2.18-.24-4.24-1.54-5.32-3.48a9.49 9.49 0 01-1.01-6.19 9.38 9.38 0 014.28-6.73 9.41 9.41 0 017.58-.91V9.45c-1.37-.5-2.92-.37-4.14.42-1.22.8-2.02 2.21-2.13 3.69-.15 1.48.42 3.01 1.52 4.02s2.69 1.44 4.19 1.16c1.5-.24 2.8-1.44 3.19-2.92.12-.55.15-1.12.14-1.68V.02z"/>
              </svg>
            )}
            <span>{loadingProvider === 'tiktok' ? 'Connecting to TikTok...' : 'Continue with TikTok'}</span>
          </button>
        </div>

        {/* Info Privacy Footer */}
        <div className="text-[11.5px] text-[#9aa39c] text-center mt-7 leading-relaxed">
          By continuing, you agree to PantryPal's <span className="underline hover:text-[#717c75] cursor-pointer">Terms of Service</span> and <span className="underline hover:text-[#717c75] cursor-pointer">Privacy Policy</span>.
        </div>
      </div>
    </div>
  );
};
