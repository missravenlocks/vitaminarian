import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();
const rootDir = process.cwd();

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', '.vite', '.local']);
const EXCLUDED_FILES = new Set(['vitaminarian-project.zip']);

function addDirectoryToZip(dirPath, zipFolder) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.has(item)) {
        const nextZipFolder = zipFolder ? zipFolder.folder(item) : zip.folder(item);
        addDirectoryToZip(fullPath, nextZipFolder);
      }
    } else {
      if (!EXCLUDED_FILES.has(item) && !item.endsWith('.zip')) {
        const fileContent = fs.readFileSync(fullPath);
        if (zipFolder) {
          zipFolder.file(item, fileContent);
        } else {
          zip.file(item, fileContent);
        }
      }
    }
  }
}

async function main() {
  console.log('Generating Vitaminarian project zip archive...');
  addDirectoryToZip(rootDir, null);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(path.join(rootDir, 'vitaminarian-project.zip'), buffer);
  
  if (!fs.existsSync(path.join(rootDir, 'public'))) {
    fs.mkdirSync(path.join(rootDir, 'public'), { recursive: true });
  }
  fs.writeFileSync(path.join(rootDir, 'public', 'vitaminarian-project.zip'), buffer);

  console.log(`Successfully generated vitaminarian-project.zip (${buffer.length} bytes)`);
}

main().catch(err => {
  console.error('Error generating zip:', err);
  process.exit(1);
});
