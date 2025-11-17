/**
 * Gmail OAuth2 Refresh Token Generator
 * 
 * This script helps you generate a refresh token for Gmail OAuth2 authentication.
 * It uses a local web server to receive the OAuth callback (Google deprecated OOB flow).
 * 
 * Usage:
 * 1. Get your Client Secret from Google Cloud Console
 * 2. Add http://localhost:3000/oauth/callback to your authorized redirect URIs
 * 3. Run: node generate-gmail-refresh-token.js
 * 4. Follow the prompts
 */

const http = require('http');
const url = require('url');
const readline = require('readline');
const https = require('https');

// Default Client ID (can be overridden by environment variable or prompt)
const DEFAULT_CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';
const PORT = 3000;
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function generateRefreshToken() {
  console.log('\n📧 Gmail OAuth2 Refresh Token Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get Client ID (from env var, default, or prompt)
  let clientId = DEFAULT_CLIENT_ID;
  if (clientId === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
    console.log('⚠️  No Client ID found. Please enter your OAuth 2.0 Client ID.');
    console.log('   You can find it in Google Cloud Console:');
    console.log('   https://console.cloud.google.com/apis/credentials\n');
    clientId = await question('Enter your Gmail Client ID: ');
    
    if (!clientId || clientId.trim() === '' || clientId.includes('YOUR_CLIENT_ID_HERE')) {
      console.error('\n❌ Client ID is required!');
      console.log('\n📋 Steps to get your Client ID:');
      console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
      console.log('   2. Find or create your OAuth 2.0 Client ID');
      console.log('   3. Copy the Client ID (ends with .apps.googleusercontent.com)');
      console.log('   See docs/GMAIL_NEW_CLIENT_SETUP.md for detailed instructions.\n');
      rl.close();
      process.exit(1);
    }
    clientId = clientId.trim();
  }
  
  console.log(`\n✅ Using Client ID: ${clientId}\n`);
  
  console.log('⚠️  IMPORTANT: Before continuing, make sure you have added');
  console.log('   this redirect URI to your Google Cloud Console:');
  console.log(`   ${REDIRECT_URI}\n`);
  
  const proceed = await question('Have you added the redirect URI? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\n📋 Steps to add redirect URI:');
    console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('   2. Click on your OAuth 2.0 Client ID');
    console.log('   3. Under "Authorized redirect URIs", click "ADD URI"');
    console.log(`   4. Add: ${REDIRECT_URI}`);
    console.log('   5. Click "SAVE"\n');
    console.log('   Then run this script again.\n');
    rl.close();
    process.exit(0);
  }

  // Get client secret
  const clientSecret = await question('\nEnter your Gmail Client Secret (from Google Cloud Console): ');
  
  if (!clientSecret || clientSecret.trim() === '') {
    console.error('\n❌ Client Secret is required!');
    rl.close();
    process.exit(1);
  }

  // Step 1: Generate authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('\n📋 Step 1: Starting local web server...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create a promise that resolves when we get the authorization code
  let authCodePromise = new Promise((resolve, reject) => {
    // Create a simple HTTP server to receive the callback
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      // Handle favicon requests (browsers request this automatically)
      if (parsedUrl.pathname === '/favicon.ico') {
        res.writeHead(204, { 'Content-Type': 'image/x-icon' });
        res.end();
        return;
      }
      
      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code;
        const error = parsedUrl.query.error;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>OAuth Error</title></head>
              <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1 style="color: red;">❌ OAuth Error</h1>
                <p>Error: ${error}</p>
                <p>${parsedUrl.query.error_description || ''}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(error));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Success!</title></head>
              <body style="font-family: Arial; padding: 40px; text-align: center;">
                <h1 style="color: green;">✅ Success!</h1>
                <p>Authorization code received. Processing...</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          resolve(code);
          return;
        }
      }

      // Default response
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(PORT, () => {
      console.log(`✅ Local server started on port ${PORT}`);
      console.log('\n📋 Step 2: Authorize the application');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n1. Opening authorization URL in your browser...');
      console.log('2. Sign in with your Google account (the one you want to use for sending emails)');
      console.log('3. Click "Allow" to grant permission');
      console.log('4. You will be redirected back to this script\n');
      console.log('If the browser doesn\'t open automatically, visit:');
      console.log('\n   ' + authUrl + '\n');
      
      // Try to open browser (works on macOS, Linux, Windows)
      const { exec } = require('child_process');
      const platform = process.platform;
      let command;
      
      if (platform === 'darwin') {
        command = 'open';
      } else if (platform === 'win32') {
        command = 'start';
      } else {
        command = 'xdg-open';
      }
      
      exec(`${command} "${authUrl}"`, (err) => {
        if (err) {
          console.log('   (Could not open browser automatically)\n');
        }
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout: No authorization received within 5 minutes'));
    }, 5 * 60 * 1000);
  });

  // Wait for authorization code
  let authCode;
  try {
    authCode = await authCodePromise;
    console.log('\n✅ Authorization code received!\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    rl.close();
    process.exit(1);
  }

  // Step 2: Exchange authorization code for tokens
  console.log('⏳ Exchanging authorization code for tokens...\n');

  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret.trim(),
    code: authCode,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            console.error('\n❌ Error:', response.error);
            console.error('   Description:', response.error_description || 'Unknown error');
            
            if (response.error === 'invalid_client') {
              console.error('\n💡 Troubleshooting:');
              console.error('   This usually means the Client Secret is incorrect.');
              console.error('   Please check:');
              console.error('   1. Go to: https://console.cloud.google.com/apis/credentials');
              console.error('   2. Find your OAuth 2.0 Client ID');
              console.error('   3. Click on it and verify the Client Secret');
              console.error('   4. Make sure you copied the entire Client Secret (no spaces/truncation)');
              console.error('   5. Try generating a new Client Secret if needed');
            }
            
            rl.close();
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (!response.refresh_token) {
            console.error('\n❌ No refresh token received!');
            console.error('   This might happen if you already authorized this app before.');
            console.error('   Try revoking access first: https://myaccount.google.com/permissions');
            console.error('\n   Response:', JSON.stringify(response, null, 2));
            rl.close();
            reject(new Error('No refresh token received'));
            return;
          }

          // Success!
          console.log('\n✅ Success! Your OAuth2 tokens:\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\n📋 Add these to your .env file:\n');
          console.log('EMAIL_SERVICE=gmail-oauth2');
          console.log('GMAIL_USER=info@liaizen.com');
          console.log(`GMAIL_CLIENT_ID=${clientId}`);
          console.log(`GMAIL_CLIENT_SECRET=${clientSecret.trim()}`);
          console.log(`GMAIL_REFRESH_TOKEN=${response.refresh_token}`);
          console.log('EMAIL_FROM=info@liaizen.com');
          console.log('APP_NAME=LiaiZen');
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('💡 Note: The access token will be automatically generated when needed.');
          console.log('   The refresh token is permanent and can be reused.\n');

          rl.close();
          resolve(response);
        } catch (err) {
          console.error('\n❌ Error parsing response:', err);
          console.error('   Response:', data);
          rl.close();
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('\n❌ Request error:', err);
      rl.close();
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Run the generator
generateRefreshToken()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Failed to generate refresh token:', err.message);
    process.exit(1);
  });
