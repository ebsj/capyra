import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-foreground': 'rgb(var(--brand-foreground) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        cocoa: 'rgb(var(--cocoa) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        'sage-soft': 'rgb(var(--sage-soft) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--brand) / 0.08), 0 25px 60px rgb(15 23 42 / 0.12)',
        panel: '0 20px 50px rgb(15 23 42 / 0.10)'
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.82' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'fade-up': 'fadeUp 700ms ease-out both',
        'pulse-soft': 'pulseSoft 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
