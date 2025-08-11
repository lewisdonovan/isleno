// Theme configurations for charts and UI components
export const CHART_THEMES = { 
  light: "", 
  dark: ".dark" 
} as const;

// Toast/Sonner theme styles
export const TOAST_STYLES = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
} as const;

// Demo card styling configurations
export const DEMO_CARD_STYLES = {
  info: {
    card: "border-teal-200 bg-teal-50/50 dark:border-teal-800/50 dark:bg-teal-950/20",
    title: "text-teal-800 dark:text-teal-200",
    content: "text-teal-700 dark:text-teal-300",
    link: "hover:text-teal-600 dark:hover:text-teal-100 transition-colors",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20",
    title: "text-amber-800 dark:text-amber-200", 
    content: "text-amber-700 dark:text-amber-300",
  },
} as const; 