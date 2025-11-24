# Figma API Integration Guide

## Overview

This project now includes Figma API integration, allowing you to:
- Read Figma file data and structure
- Export images and assets from designs
- Get comments and feedback from Figma files
- Sync design specs to code
- Access Figma data through both backend API and AI assistant (via MCP)

## Setup Instructions

### Step 1: Get Figma Personal Access Token

1. **Go to Figma Account Settings**:
   - Open Figma (web or desktop app)
   - Click your profile icon (top right)
   - Select **Settings** → **Account**

2. **Generate Access Token**:
   - Scroll down to **Personal access tokens**
   - Click **Create new token**
   - Give it a name: `LiaiZen Integration`
   - Set expiration (recommended: 1 year for development)
   - Click **Create token**
   - **COPY THE TOKEN** (you won't see it again!)

### Step 2: Add Token to Backend

#### Option A: Local Development (.env file)

```bash
# Edit the server .env file
nano /Users/athenasees/Desktop/chat/chat-server/.env

# Add this line:
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

#### Option B: Railway Production

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Select your service
3. Go to **Variables** tab
4. Click **New Variable**
5. Name: `FIGMA_ACCESS_TOKEN`
6. Value: `figd_your_token_here`
7. Click **Add**

### Step 3: Restart Server

After adding the token, restart your server:

```bash
# Local development
cd chat-server
npm start

# Or if using restart script
./restart-server.sh
```

### Step 4: Verify Setup

Test the integration:

```bash
# Check if Figma service is available
curl http://localhost:3001/api/figma/status

# Should return:
# {"available":true,"message":"Figma API service is available"}
```

## API Endpoints

All Figma endpoints are under `/api/figma/`:

### 1. Check Service Status
```
GET /api/figma/status
```
Returns whether Figma service is configured and available.

### 2. Get File Data
```
GET /api/figma/file/:fileKey
```
Get complete file structure and data.

**Query Parameters:**
- `version` (optional) - Specific file version
- `ids` (optional) - Comma-separated node IDs to filter
- `depth` (optional) - Tree depth to return
- `geometry` (optional) - `true` to include geometry paths
- `plugin_data` (optional) - `true` to include plugin data
- `styles` (optional) - `true` to include style information

**Example:**
```bash
curl "http://localhost:3001/api/figma/file/abc123def456?depth=2&styles=true"
```

### 3. Get Specific Nodes
```
GET /api/figma/file/:fileKey/nodes?ids=node1,node2
```
Get specific nodes from a file.

**Example:**
```bash
curl "http://localhost:3001/api/figma/file/abc123def456/nodes?ids=1:2,3:4"
```

### 4. Export Images
```
GET /api/figma/images/:fileKey?ids=node1,node2&format=png&scale=2
```
Export images from Figma nodes.

**Query Parameters:**
- `ids` (required) - Comma-separated node IDs
- `format` (optional) - `png`, `jpg`, `svg`, or `pdf` (default: `png`)
- `scale` (optional) - Scale factor (default: `1`, max: `4`)
- `use_absolute_bounds` (optional) - `true` to use absolute bounds

**Example:**
```bash
curl "http://localhost:3001/api/figma/images/abc123def456?ids=1:2&format=png&scale=2"
```

### 5. Get Comments
```
GET /api/figma/file/:fileKey/comments
```
Get all comments from a Figma file.

**Example:**
```bash
curl "http://localhost:3001/api/figma/file/abc123def456/comments"
```

### 6. Post Comment
```
POST /api/figma/file/:fileKey/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "message": "This design looks great!",
  "comment_id": null  // Optional: reply to existing comment
}
```
Post a comment to a Figma file (requires authentication).

### 7. Extract File Key from URL
```
POST /api/figma/extract
Content-Type: application/json

{
  "url": "https://www.figma.com/file/abc123def456/My-Design?node-id=1%3A2"
}
```

Returns:
```json
{
  "fileKey": "abc123def456",
  "nodeId": "1:2",
  "valid": true
}
```

## Usage Examples

### Extract File Key from URL

```javascript
// Frontend example
const response = await fetch('http://localhost:3001/api/figma/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.figma.com/file/abc123def456/My-Design'
  })
});

const { fileKey } = await response.json();
```

### Get File Structure

```javascript
const response = await fetch(`http://localhost:3001/api/figma/file/${fileKey}?styles=true`);
const fileData = await response.json();

// Access design data
const document = fileData.document;
const components = fileData.components;
const styles = fileData.styles;
```

### Export Component as Image

```javascript
const nodeId = '1:2'; // Component node ID
const response = await fetch(
  `http://localhost:3001/api/figma/images/${fileKey}?ids=${nodeId}&format=png&scale=2`
);
const imageData = await response.json();

// Get image URL
const imageUrl = imageData.images[nodeId];
```

## Figma MCP Server (AI Access)

The Figma integration is also available through Model Context Protocol (MCP) for AI assistants.

### Setup (Optional)

The MCP server allows Claude to directly access Figma files. To enable:

1. **Edit MCP Config**:
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

2. **Add Figma MCP Server** (if package exists):
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_your_token_here"
      },
      "description": "Figma API access for design files"
    }
  }
}
```

3. **Restart Claude Desktop**

**Note**: As of now, there may not be an official Figma MCP server package. The backend API endpoints above provide full Figma functionality for your application.

## Figma URL Format

Figma URLs follow this pattern:
```
https://www.figma.com/file/{FILE_KEY}/{FILE_NAME}?node-id={NODE_ID}
```

The service automatically extracts:
- **File Key**: Unique identifier for the file
- **Node ID**: Specific node/element in the file (optional)

## Common Use Cases

### 1. Design-to-Code Sync
- Fetch component specifications from Figma
- Extract design tokens (colors, spacing, typography)
- Generate React components based on designs

### 2. Asset Export
- Export icons and images from Figma
- Generate optimized assets for web/app use
- Create asset libraries from design files

### 3. Design Review
- Read comments from design files
- Post feedback programmatically
- Track design iterations

### 4. Design System Sync
- Extract design tokens from Figma
- Sync color palettes and typography
- Keep codebase in sync with designs

## Rate Limits

Figma API has rate limits:
- **30 requests per second** per access token
- Be mindful of making too many requests in quick succession

The service includes basic error handling, but you may want to add retry logic for production use.

## Security Notes

- **Never commit** your Figma access token to version control
- **Keep tokens secure** in environment variables
- **Rotate tokens** every 90 days for production
- **Use read-only tokens** when possible (if available)

## Troubleshooting

### Service Not Available
```
{"available":false,"message":"Figma API service not configured..."}
```

**Solution**: Make sure `FIGMA_ACCESS_TOKEN` is set in your environment variables and server is restarted.

### Invalid Token Error
```
{"error":"Figma API error: Invalid token"}
```

**Solution**: Verify your token is correct and hasn't expired. Generate a new token if needed.

### File Not Found
```
{"error":"Figma API error: File not found"}
```

**Solution**: 
- Verify the file key is correct
- Ensure the file is accessible with your token
- Check if the file has been deleted or moved

### CORS Issues
If accessing from frontend, make sure CORS is configured properly in `server.js`. The existing CORS configuration should handle this.

## Resources

- [Figma REST API Documentation](https://www.figma.com/developers/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Figma Developer Portal](https://www.figma.com/developers)

---

*Last Updated: 2025-01-23*
*Project: LiaiZen Co-Parenting Platform*

