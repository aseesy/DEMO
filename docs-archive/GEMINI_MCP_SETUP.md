# Gemini MCP Server Setup for Cursor

This guide will help you set up Gemini as an MCP (Model Context Protocol) server add-on in Cursor, making it available as a tool you can use while coding.

## Option 1: Use Existing Gemini MCP Server (Recommended)

### Step 1: Install the Gemini MCP Server

```bash
npm install -g @modelcontextprotocol/server-gemini
```

Or install locally in your project:

```bash
cd /Users/athenasees/Desktop/chat
npm install @modelcontextprotocol/server-gemini
```

### Step 2: Configure Cursor MCP Settings

The MCP configuration file location for Cursor:

**macOS**:

```
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Windows**:

```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Linux**:

```
~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### Step 3: Add Gemini to MCP Configuration

Open the MCP settings file and add:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gemini"],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE"
      },
      "description": "Google Gemini AI for code generation and assistance"
    }
  }
}
```

**Important**: Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key.

### Step 4: Restart Cursor

After saving the configuration, restart Cursor completely for the MCP server to be recognized.

## Option 2: Create Custom Gemini MCP Server

If the official server doesn't exist or you need custom functionality, you can create your own:

### Step 1: Create MCP Server Directory

```bash
cd /Users/athenasees/Desktop/chat
mkdir -p mcp-servers/gemini
cd mcp-servers/gemini
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install @modelcontextprotocol/sdk @google/generative-ai
```

### Step 3: Create Server File

Create `server.js`:

```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const server = new Server(
  {
    name: 'gemini-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Generate code with Gemini
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'generate_code',
      description: 'Generate code using Gemini AI',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The code generation prompt',
          },
          language: {
            type: 'string',
            description: 'Programming language (optional)',
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'explain_code',
      description: 'Explain code using Gemini AI',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to explain',
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'refactor_code',
      description: 'Refactor code using Gemini AI',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The code to refactor',
          },
          improvements: {
            type: 'string',
            description: 'Specific improvements to make (optional)',
          },
        },
        required: ['code'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async request => {
  const { name, arguments: args } = request.params;

  const model = genAI.getGenerativeModel({ model: 'gemini-3.0-pro' });

  try {
    let prompt = '';

    switch (name) {
      case 'generate_code':
        prompt = `Generate ${args.language || 'JavaScript'} code for: ${args.prompt}`;
        break;
      case 'explain_code':
        prompt = `Explain this code:\n\n${args.code}`;
        break;
      case 'refactor_code':
        prompt = `Refactor this code${args.improvements ? ` with these improvements: ${args.improvements}` : ''}:\n\n${args.code}`;
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: [
        {
          type: 'text',
          text: text,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gemini MCP server running on stdio');
}

main().catch(console.error);
```

### Step 4: Make it Executable

```bash
chmod +x server.js
```

### Step 5: Update package.json

Add to `package.json`:

```json
{
  "type": "module",
  "bin": {
    "gemini-mcp": "./server.js"
  }
}
```

### Step 6: Configure Cursor

Add to your MCP settings:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/Users/athenasees/Desktop/chat/mcp-servers/gemini/server.js"],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE"
      },
      "description": "Custom Gemini MCP server for code generation"
    }
  }
}
```

## Option 3: Use Gemini via Environment Variable

If you prefer to keep your API key in an environment variable:

1. Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export GEMINI_API_KEY="your-api-key-here"
```

2. Update MCP config to use the environment variable:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gemini"],
      "env": {
        "GEMINI_API_KEY": "env:GEMINI_API_KEY"
      }
    }
  }
}
```

## Testing the Integration

After setup, restart Cursor and test by:

1. Opening Cursor's chat/command palette
2. Asking: "Use Gemini to generate a React component for a button"
3. Or: "Use the Gemini tool to explain this code: [paste code]"

## Available Tools (if using custom server)

Once configured, you'll have access to:

- **generate_code**: Generate code from natural language prompts
- **explain_code**: Get explanations of code snippets
- **refactor_code**: Refactor and improve code

## Troubleshooting

1. **Server not found**: Make sure the MCP server package is installed globally or the path is correct
2. **API key error**: Verify your Gemini API key is correct and has proper permissions
3. **Tools not appearing**: Restart Cursor completely after configuration changes
4. **Connection issues**: Check Cursor's MCP server logs in the developer console

## Security Notes

- Never commit your API key to version control
- Use environment variables for API keys
- Consider using a secrets manager for production
- Rotate API keys regularly
