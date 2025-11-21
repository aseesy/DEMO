#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DesignTokensServer {
  constructor() {
    this.server = new Server(
      {
        name: 'liaizen-design-tokens',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.tokensPath = path.join(__dirname, 'tokens.json');
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_token',
          description: 'Get a specific design token value by path (e.g., "colors.brand.primary")',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Dot-separated path to the token (e.g., "colors.brand.primary")',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'list_tokens',
          description: 'List all available design tokens or tokens under a specific category',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Optional category to filter by (e.g., "colors", "spacing")',
              },
            },
          },
        },
        {
          name: 'search_tokens',
          description: 'Search for design tokens by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to match against token names and descriptions',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'update_token',
          description: 'Update a design token value',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Dot-separated path to the token',
              },
              value: {
                type: 'string',
                description: 'New value for the token',
              },
            },
            required: ['path', 'value'],
          },
        },
      ],
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'liaizen://design-tokens',
          name: 'LiaiZen Design Tokens',
          mimeType: 'application/json',
          description: 'Complete design token system for LiaiZen',
        },
      ],
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      if (request.params.uri === 'liaizen://design-tokens') {
        const tokens = await this.loadTokens();
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(tokens, null, 2),
            },
          ],
        };
      }
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_token':
          return await this.getToken(args.path);
        case 'list_tokens':
          return await this.listTokens(args.category);
        case 'search_tokens':
          return await this.searchTokens(args.query);
        case 'update_token':
          return await this.updateToken(args.path, args.value);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async loadTokens() {
    try {
      const data = await fs.readFile(this.tokensPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load tokens: ${error.message}`);
    }
  }

  async saveTokens(tokens) {
    try {
      await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save tokens: ${error.message}`);
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = { ...target[lastKey], value };
  }

  async getToken(tokenPath) {
    const tokens = await this.loadTokens();
    const token = this.getNestedValue(tokens, tokenPath);

    if (!token) {
      return {
        content: [
          {
            type: 'text',
            text: `Token not found: ${tokenPath}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(token, null, 2),
        },
      ],
    };
  }

  async listTokens(category) {
    const tokens = await this.loadTokens();
    const targetTokens = category ? tokens[category] : tokens;

    if (!targetTokens) {
      return {
        content: [
          {
            type: 'text',
            text: `Category not found: ${category}`,
          },
        ],
      };
    }

    const formatTokens = (obj, prefix = '') => {
      let result = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        if (value.value !== undefined) {
          result.push({
            path: fullPath,
            value: value.value,
            type: value.type,
            description: value.description,
          });
        } else if (typeof value === 'object') {
          result = result.concat(formatTokens(value, fullPath));
        }
      }
      return result;
    };

    const formattedTokens = formatTokens(targetTokens, category || '');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedTokens, null, 2),
        },
      ],
    };
  }

  async searchTokens(query) {
    const tokens = await this.loadTokens();
    const lowerQuery = query.toLowerCase();
    const results = [];

    const searchRecursive = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const pathMatch = fullPath.toLowerCase().includes(lowerQuery);
        const descMatch = value.description?.toLowerCase().includes(lowerQuery);
        const valueMatch = value.value?.toString().toLowerCase().includes(lowerQuery);

        if (value.value !== undefined && (pathMatch || descMatch || valueMatch)) {
          results.push({
            path: fullPath,
            value: value.value,
            type: value.type,
            description: value.description,
          });
        } else if (typeof value === 'object' && !value.value) {
          searchRecursive(value, fullPath);
        }
      }
    };

    searchRecursive(tokens);

    return {
      content: [
        {
          type: 'text',
          text: results.length > 0
            ? JSON.stringify(results, null, 2)
            : `No tokens found matching: ${query}`,
        },
      ],
    };
  }

  async updateToken(tokenPath, newValue) {
    const tokens = await this.loadTokens();
    const existingToken = this.getNestedValue(tokens, tokenPath);

    if (!existingToken) {
      return {
        content: [
          {
            type: 'text',
            text: `Token not found: ${tokenPath}`,
          },
        ],
      };
    }

    this.setNestedValue(tokens, tokenPath, newValue);
    await this.saveTokens(tokens);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated ${tokenPath} to ${newValue}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LiaiZen Design Tokens MCP Server running on stdio');
  }
}

const server = new DesignTokensServer();
server.run().catch(console.error);
