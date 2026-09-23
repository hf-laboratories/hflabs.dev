import fs from 'fs';
import path from 'path';

const bookDir = './src/content/book';
const compDir = './src/content/book/components';

if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });
if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

// We will populate components data
console.log('Book directories verified.');
