import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    ignores: ['node_modules/**', '.next/**', '.playwright-cli/**', 'public/**', 'dist/**', 'build/**', 'coverage/**', '**/*.d.ts', '*.min.js']
  }
];

export default config;
