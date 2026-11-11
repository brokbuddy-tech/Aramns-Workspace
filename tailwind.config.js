/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#F9F9F8',
          dark: '#F2F2EF',
          light: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          hover: '#F5F5F2',
        },
        bronze: {
          DEFAULT: '#9E7B36',
          light: '#B58F45',
          dark: '#7C5E20',
          glow: 'rgba(158, 123, 54, 0.20)',
        },
        charcoal: {
          DEFAULT: '#0F172A',
          dark: '#000000',
          light: '#334155',
        },
        cream: {
          DEFAULT: '#FFFFFF',
          subtle: '#F9F9F8',
          warm: '#F5F4EF',
        },
        silver: {
          DEFAULT: '#475569',
          muted: '#64748B',
          light: '#1E293B',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        luxury: '0.2em',
        'luxury-wide': '0.3em',
      },
      borderRadius: {
        'card': '8px',
        'section': '24px',
      },
      boxShadow: {
        'luxury-glass': '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'gold-glow': '0 0 30px rgba(197, 160, 89, 0.25)',
        'gold-glow-lg': '0 0 60px rgba(197, 160, 89, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'scroll-reel-char-rise': 'scroll-reel-char-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scroll-reel-exit': 'scroll-reel-exit 0.24s cubic-bezier(0.65, 0, 0.35, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'scroll-reel-char-rise': {
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scroll-reel-exit': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-12px)' },
        },
      }
    },
  },
  plugins: [],
};
