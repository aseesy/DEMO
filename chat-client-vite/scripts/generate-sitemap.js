// scripts/generate-sitemap.js
// Simple script to generate a public sitemap.xml from the marketing sitemap JSON.
// It is safe for non‑technical users – just run `npm run generate:sitemap`
// or it will run automatically before `npm run build`.

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Base URL of the site – change this in .env if needed.
const BASE_URL = process.env.BASE_URL || 'https://example.com';

const marketingSitemapPath = resolve('src', 'routes', 'marketing', 'sitemap.json');
const outputPath = resolve('public', 'sitemap.xml');

function generate() {
  try {
    const raw = readFileSync(marketingSitemapPath, 'utf-8');
    const data = JSON.parse(raw);
    const pages = data.pages || [];

    const urls = pages
      .map(p => {
        const loc = `${BASE_URL}${p.slug}`;
        return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    writeFileSync(outputPath, xml, 'utf-8');
    console.log('✅ sitemap.xml generated at', outputPath);
  } catch (err) {
    console.error('❌ Failed to generate sitemap.xml:', err);
    process.exit(1);
  }
}

generate();
