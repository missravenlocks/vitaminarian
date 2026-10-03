import JSZip from 'jszip';
import { INITIAL_FOODS_CSV, INITIAL_MEALS_CSV, INITIAL_DAILY_VALUES_CSV, INITIAL_FOOD_LOG_CSV } from '../data/initialData.ts';

export async function generateProjectZip(
  currentFoods: string = INITIAL_FOODS_CSV,
  currentMeals: string = INITIAL_MEALS_CSV,
  currentDV: string = INITIAL_DAILY_VALUES_CSV,
  currentFoodLog: string = INITIAL_FOOD_LOG_CSV
): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file('package.json', JSON.stringify({
    name: "vitaminarian",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview"
    },
    dependencies: {
      "@tailwindcss/vite": "^4.3.3",
      "@vitejs/plugin-react": "^6.1.1",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "motion": "^12.23.24",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "tailwindcss": "^4.3.3",
      "vite": "^8.3.0"
    },
    devDependencies: {
      "@types/jszip": "^3.4.1",
      "@types/node": "^22.14.0",
      "@types/react": "^19.3.0",
      "@types/react-dom": "^19.3.0",
      "typescript": "^7.0.2"
    }
  }, null, 2));

  zip.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"]
  }, null, 2));

  zip.file('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`);

  zip.file('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vitaminarian - Customizable Nutrition Tracking</title>
    <meta name="description" content="Customizable nutrition tracking app with detailed food breakdown, dynamic macro and micronutrient analysis, and CSV data management." />
    <meta property="og:title" content="Vitaminarian - Customizable Nutrition Tracking" />
    <meta property="og:description" content="Customizable nutrition tracking app with detailed food breakdown, dynamic macro and micronutrient analysis, and CSV data management." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body class="bg-neutral-50 text-neutral-900 antialiased font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  zip.file('.gitignore', `node_modules
dist
dist-ssr
*.local
.env
`);

  zip.file('README.md', `# Vitaminarian

Customizable nutrition tracking application with detailed food decomposition tree, dynamic macro & micronutrient dashboards, and CSV dataset upload/download management.

## Setup & Running Locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and select your repository.
3. Framework Preset: **Vite**.
4. Click **Deploy**.
`);

  // Public files
  const pub = zip.folder('public');
  if (pub) {
    pub.file('Foods.csv', currentFoods);
    pub.file('Meals.csv', currentMeals);
    pub.file('Daily Values.csv', currentDV);
    pub.file('Food Log.csv', currentFoodLog);
  }

  // Generate blob
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
