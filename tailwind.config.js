/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx,html}",
        "./pages/**/*.{js,ts,jsx,tsx,html}",
        "./components/**/*.{js,ts,jsx,tsx,html}",
        "./context/**/*.{js,ts,jsx,tsx,html}",
        "./hooks/**/*.{js,ts,jsx,tsx,html}",
        "./lib/**/*.{js,ts,jsx,tsx,html}",
        "./src/**/*.{js,ts,jsx,tsx,html}",
    ],
    theme: {
        extend: {
            colors: {
                surface: "var(--surface)",
                "surface-bright": "var(--surface-bright)",
                "surface-dim": "var(--surface-dim)",
                "surface-container-lowest": "var(--surface-container-lowest)",
                "surface-container-low": "var(--surface-container-low)",
                "surface-container": "var(--surface-container)",
                "surface-container-high": "var(--surface-container-high)",
                "surface-container-highest": "var(--surface-container-highest)",
                "on-surface": "var(--on-surface)",
                "on-surface-variant": "var(--on-surface-variant)",
                primary: "var(--primary)",
                "on-primary": "var(--on-primary)",
                "primary-container": "var(--primary-container)",
                "on-primary-container": "var(--on-primary-container)",
                "primary-vibrant": "var(--primary-vibrant)",
                secondary: "var(--secondary)",
                "on-secondary": "var(--on-secondary)",
                "secondary-container": "var(--secondary-container)",
                "on-secondary-container": "var(--on-secondary-container)",
                error: "var(--error)",
                "on-error": "var(--on-error)",
                "error-container": "var(--error-container)",
                "on-error-container": "var(--on-error-container)",
                outline: "var(--outline)",
                "outline-variant": "var(--outline-variant)",
                "inverse-surface": "var(--inverse-surface)",
                "inverse-on-surface": "var(--inverse-on-surface)",
                "inverse-primary": "var(--inverse-primary)",
                accent: "var(--accent)",
                "accent-hover": "var(--accent-hover)",
                "accent-container": "var(--accent-container)",
                warning: "var(--warning)"
            },
            fontFamily: {
                display: ['Manrope', 'sans-serif'],
                headline: ['Manrope', 'sans-serif'],
                body: ['Plus Jakarta Sans', 'sans-serif'],
                label: ['Plus Jakarta Sans', 'sans-serif'],
                sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                "premium": "0 10px 40px -10px rgba(0, 0, 0, 0.05)",
                "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.03)",
                "trust": "0 2px 8px -2px rgba(0, 0, 0, 0.04)",
            },
            borderRadius: {
                '3xl': '1rem',
                '4xl': '1.5rem',
            },
            animation: {
                'float': 'float 4s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
