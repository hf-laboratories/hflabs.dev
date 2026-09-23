import fs from 'fs';
import path from 'path';

const compDir = './src/content/book/components';
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

// Read existing chapters to make sure we don't overwrite if not needed
console.log("Generating book component files...");
