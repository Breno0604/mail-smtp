/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}', './scripts/**/*.js', './public/**/*.html'],
  safelist: [
    // Classes dinâmicas construídas em runtime
    'w-full',
    'w-[70%]',
    'w-[30%]',
    'flex-shrink-0',
    'grid-cols-3',
    'grid-cols-2',
    'grid-cols-4',
    'gap-3',
    'gap-2',
    'mb-4',
    'mb-1',
    // Classes de estado
    'is-filled',
    'error',
    'hidden',
    // Cores dinâmicas
    { pattern: /bg-(red|green|blue|slate)-(50|100|200|500|600)/ },
    { pattern: /border-(red|green|blue|slate)-(200|500)/ },
    { pattern: /text-(red|green|blue|slate)-(500|600|800|900)/ },
  ],
  theme: { extend: {} },
  plugins: [],
};
