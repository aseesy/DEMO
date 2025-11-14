# 📱 PWA Setup Guide - Install LiaiZen on Your Phone

LiaiZen is now a Progressive Web App (PWA), which means you can install it on your phone just like a native app!

## 🚀 How to Install on Your Phone

### iPhone (Safari)

1. Open Safari on your iPhone
2. Navigate to your LiaiZen app (e.g., `http://YOUR-IP:3000`)
3. Tap the **Share** button (square with arrow) at the bottom
4. Scroll down and tap **"Add to Home Screen"**
5. Customize the name if desired (default: "LiaiZen")
6. Tap **"Add"** in the top right
7. The app icon will appear on your home screen!

### Android (Chrome)

1. Open Chrome on your Android device
2. Navigate to your LiaiZen app (e.g., `http://YOUR-IP:3000`)
3. You may see an **"Install App"** banner at the bottom - tap it
4. OR tap the **menu** (three dots) → **"Install app"** or **"Add to Home screen"**
5. Tap **"Install"** in the popup
6. The app will be installed and appear in your app drawer!

### Desktop (Chrome/Edge)

1. Open Chrome or Edge browser
2. Navigate to your LiaiZen app
3. Look for the **install icon** (➕) in the address bar
4. Click it and select **"Install"**
5. The app will open in its own window!

## ✨ Features When Installed

- **Standalone Mode**: Opens in its own window (no browser UI)
- **Home Screen Icon**: Quick access from your phone's home screen
- **Offline Support**: Basic offline functionality (cached pages)
- **App-like Experience**: Full-screen, native app feel

## 🔧 Requirements

- **HTTPS**: PWAs require HTTPS in production (localhost works for development)
- **Icons**: App icons (192x192 and 512x512) are included
- **Manifest**: Web app manifest is configured
- **Service Worker**: Enables offline functionality

## 📝 Notes

- The app works best when accessed over HTTPS
- For local development, use `localhost` or your local IP
- For production, you'll need an SSL certificate
- The install prompt will appear automatically on supported browsers

## 🎨 Customization

Icons are generated from your logo. To update them:
1. Replace `icon-192.png` and `icon-512.png` in the `chat-client` folder
2. Ensure they are PNG format
3. Recommended sizes: 192x192 and 512x512 pixels

Enjoy your installable LiaiZen app! 📱✨

