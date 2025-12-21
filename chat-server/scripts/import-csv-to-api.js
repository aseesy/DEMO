#!/usr/bin/env node
/**
 * Import CSV conversation history via API
 *
 * Usage: node scripts/import-csv-to-api.js <csv-file>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_URL = 'https://demo-production-6dcd.up.railway.app';
const JWT_SECRET =
  '54bfbcbe62a187dc870d6b16f135527061fa1c96c8ea9e8b14ab975b9d542ea9ef14fdfdc3a78c0fefe1781d295d31d823573da7c26a67d794400d18f3d6b702';

// User mapping
const USER_MAP = {
  Athena: 'athenasees',
  Yashir: 'yashir91lora',
};

// Room ID (from your shared room)
const ROOM_ID = 'room_1765827298745_878fce74a53e7';

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const messages = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);

    if (fields.length >= 7) {
      const timestamp = fields[1];
      const senderName = fields[3];
      const text = fields[6];

      const username = USER_MAP[senderName];

      if (username && text && text.trim()) {
        messages.push({
          username,
          text: text.trim(),
          timestamp: new Date(timestamp.replace(' ', 'T') + 'Z').toISOString(),
        });
      }
    }
  }

  return messages;
}

async function sendBatch(messages, batchNum, totalBatches) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messages,
      roomId: ROOM_ID,
    });

    const url = new URL(`${API_URL}/api/import/messages`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        Authorization: `Bearer ${JWT_SECRET}`,
      },
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log(`   Batch ${batchNum}/${totalBatches}: ${result.imported || 0} imported`);
          resolve(result);
        } catch (e) {
          console.log(`   Batch ${batchNum}/${totalBatches}: Error parsing response`);
          reject(new Error(body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('Usage: node scripts/import-csv-to-api.js <csv-file>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log('\n📥 LiaiZen Conversation Import');
  console.log('═══════════════════════════════\n');
  console.log(`📄 File: ${absolutePath}`);
  console.log(`🏠 Room: ${ROOM_ID}`);
  console.log(`🌐 API: ${API_URL}\n`);

  console.log('📝 Parsing CSV...');
  const messages = parseCSV(absolutePath);
  console.log(`   Found ${messages.length} messages\n`);

  if (messages.length === 0) {
    console.log('⚠️  No messages found in CSV');
    process.exit(1);
  }

  // Show sample
  console.log('📋 Sample messages:');
  for (const msg of messages.slice(0, 3)) {
    console.log(`   [${msg.username}] ${msg.text.substring(0, 50)}...`);
  }
  console.log('');

  // Send in batches of 500
  const BATCH_SIZE = 500;
  const batches = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    batches.push(messages.slice(i, i + BATCH_SIZE));
  }

  console.log(`📤 Sending ${batches.length} batches of up to ${BATCH_SIZE} messages each...\n`);

  let totalImported = 0;
  let totalErrors = 0;

  for (let i = 0; i < batches.length; i++) {
    try {
      const result = await sendBatch(batches[i], i + 1, batches.length);
      totalImported += result.imported || 0;
      totalErrors += result.errors || 0;
    } catch (error) {
      console.error(`   Batch ${i + 1} failed:`, error.message);
      totalErrors += batches[i].length;
    }

    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log('\n═══════════════════════════════');
  console.log('📊 Import Summary:');
  console.log(`   Total parsed: ${messages.length}`);
  console.log(`   Imported: ${totalImported}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('\n✅ Import complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
