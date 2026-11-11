import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

// A meaning colour in four steps: solid (icons, bars, buttons), subtle (surface),
// border, strong (text on the subtle surface). See docs/design-system.md.
const family = (name: string) => ({
  DEFAULT: token(name),
  foreground: token(`${name}-foreground`),
  subtle: token(`${name}-subtle`),
  border: token(`${name}-border`),
  strong: token(`${name}-strong`),
});

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', md: '1.5rem' },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Plex Fallback"', ...fontFamily.sans],
        mono: ['"IBM Plex Mono"', ...fontFamily.mono],
      },
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
          hover: token('primary-hover'),
          subtle: token('primary-subtle'),
          strong: token('primary-strong'),
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        success: family('success'),
        danger: family('danger'),
        warning: family('warning'),
        premium: family('premium'),
        chart: {
          1: token('chart-1'),
          2: token('chart-2'),
          3: token('chart-3'),
          4: token('chart-4'),
          5: token('chart-5'),
        },
        difficulty: Object.fromEntries(
          [1, 2, 3, 4, 5].map((n) => [
            n,
            { DEFAULT: token(`difficulty-${n}`), foreground: token(`difficulty-${n}-foreground`) },
          ]),
        ),
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Fixed layer order: content, fixed bars, navigation, side panel, menus, dialogs, toasts.
      zIndex: {
        bar: '10',
        nav: '20',
        panel: '30',
        menu: '40',
        dialog: '50',
        toast: '60',
      },
      maxWidth: {
        page: '1200px',
        reading: '896px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
          to: { height: '0', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // touch: devices without a fine pointer get the 44 px minimum tap size.
    plugin(({ addVariant }) => addVariant('touch', '@media (pointer: coarse)')),
  ],
} satisfies Config;
