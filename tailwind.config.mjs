/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C84A',
          dark: '#B8960E',
        },
        dark: {
          DEFAULT: '#1a1a1a',
          deeper: '#111111',
          card: 'rgba(255,255,255,0.05)',
        },
        brand: {
          primary: '#D4AF37',
          error: '#FF6B6B',
          spiritual: '#c084fc',
          success: '#10b981',
          'text-primary': '#e5e7eb',
          'text-secondary': '#a0a0a0',
        },
        chat: {
          bubble: '#1C1C1C',
          drawer: '#131313',
          ink: '#E5E2E1',
          muted: '#6B7280',
          orb: '#F2CA50',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'dark-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #111111 100%)',
      },
      boxShadow: {
        gold: '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.1)',
        error: '0 0 10px rgba(255, 107, 107, 0.2)',
        spiritual: '0 0 10px rgba(192, 132, 252, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)' },
        },
      },
    },
  },
  plugins: [typography],
};
