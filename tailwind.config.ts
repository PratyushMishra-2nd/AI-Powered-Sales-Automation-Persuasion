import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neural: {
          bg: '#030915',
          surface: '#080f1a',
          surface2: '#0d1a2b',
          border: '#1a2a3a',
          dim: '#0f1e2e',
          primary: '#00d4ff',
          secondary: '#39ff14',
          accent: '#ff4757',
          text: '#c8d8e8',
          muted: '#4a6278',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(200%)' } },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.3)' },
        },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'slide-up': { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        scan: 'scan 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        blink: 'blink 1s step-start infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
} satisfies Config
