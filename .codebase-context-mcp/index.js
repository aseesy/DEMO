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

class CodebaseContextServer {
  constructor() {
    this.server = new Server(
      {
        name: 'liaizen-codebase-context',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.contextPath = path.join(__dirname, 'codebase-context.json');
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_architecture',
          description: 'Get LiaiZen architecture overview (frontend, backend, deployment)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_design_system',
          description: 'Get LiaiZen design system (colors, typography, spacing, patterns)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_file_structure',
          description: 'Get file/folder structure for frontend or backend',
          inputSchema: {
            type: 'object',
            properties: {
              area: {
                type: 'string',
                enum: ['frontend', 'backend', 'all'],
                description: 'Which area to get structure for',
              },
            },
          },
        },
        {
          name: 'get_api_endpoints',
          description: 'Get list of all API endpoints and their purposes',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_common_patterns',
          description: 'Get common coding patterns (components, modals, navigation, buttons, forms)',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                enum: ['components', 'modals', 'navigation', 'buttons', 'forms', 'all'],
                description: 'Which pattern to retrieve',
              },
            },
          },
        },
        {
          name: 'get_database_schema',
          description: 'Get database schema and table structures',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_socket_events',
          description: 'Get Socket.io event names and purposes',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'search_context',
          description: 'Search codebase context by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_best_practices',
          description: 'Get LiaiZen development best practices',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_common_issues',
          description: 'Get common issues and their solutions',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_dependencies',
          description: 'Get project dependencies for frontend and backend',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_workflow',
          description: 'Get development workflow (starting, frontend, backend, deployment)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'liaizen://codebase-context',
          name: 'LiaiZen Codebase Context',
          mimeType: 'application/json',
          description: 'Complete codebase context including architecture, patterns, and conventions',
        },
        {
          uri: 'liaizen://architecture',
          name: 'Architecture Overview',
          mimeType: 'application/json',
          description: 'Frontend and backend architecture details',
        },
        {
          uri: 'liaizen://design-system',
          name: 'Design System',
          mimeType: 'application/json',
          description: 'Colors, typography, spacing, and UI patterns',
        },
      ],
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const context = await this.loadContext();

      switch (request.params.uri) {
        case 'liaizen://codebase-context':
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(context, null, 2),
              },
            ],
          };
        case 'liaizen://architecture':
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(context.architecture, null, 2),
              },
            ],
          };
        case 'liaizen://design-system':
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(context.designSystem, null, 2),
              },
            ],
          };
        default:
          throw new Error(`Unknown resource: ${request.params.uri}`);
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_architecture':
          return await this.getArchitecture();
        case 'get_design_system':
          return await this.getDesignSystem();
        case 'get_file_structure':
          return await this.getFileStructure(args.area || 'all');
        case 'get_api_endpoints':
          return await this.getApiEndpoints();
        case 'get_common_patterns':
          return await this.getCommonPatterns(args.pattern || 'all');
        case 'get_database_schema':
          return await this.getDatabaseSchema();
        case 'get_socket_events':
          return await this.getSocketEvents();
        case 'search_context':
          return await this.searchContext(args.query);
        case 'get_best_practices':
          return await this.getBestPractices();
        case 'get_common_issues':
          return await this.getCommonIssues();
        case 'get_dependencies':
          return await this.getDependencies();
        case 'get_workflow':
          return await this.getWorkflow();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async loadContext() {
    try {
      const data = await fs.readFile(this.contextPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load context: ${error.message}`);
    }
  }

  async getArchitecture() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              project: context.project,
              architecture: context.architecture,
              keyFeatures: context.keyFeatures,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getDesignSystem() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.designSystem, null, 2),
        },
      ],
    };
  }

  async getFileStructure(area) {
    const context = await this.loadContext();
    const structure = area === 'all' ? context.fileStructure : { [area]: context.fileStructure[area] };
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  async getApiEndpoints() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.apiEndpoints, null, 2),
        },
      ],
    };
  }

  async getCommonPatterns(pattern) {
    const context = await this.loadContext();
    const patterns = pattern === 'all' ? context.commonPatterns : { [pattern]: context.commonPatterns[pattern] };
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(patterns, null, 2),
        },
      ],
    };
  }

  async getDatabaseSchema() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.databaseSchema, null, 2),
        },
      ],
    };
  }

  async getSocketEvents() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.socketEvents, null, 2),
        },
      ],
    };
  }

  async searchContext(query) {
    const context = await this.loadContext();
    const lowerQuery = query.toLowerCase();
    const results = [];

    const searchRecursive = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const keyMatch = key.toLowerCase().includes(lowerQuery);
        const valueMatch = typeof value === 'string' && value.toLowerCase().includes(lowerQuery);

        if (keyMatch || valueMatch) {
          results.push({
            path: currentPath,
            key: key,
            value: value,
          });
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          searchRecursive(value, currentPath);
        }
      }
    };

    searchRecursive(context);

    return {
      content: [
        {
          type: 'text',
          text: results.length > 0
            ? JSON.stringify(results, null, 2)
            : `No results found for: ${query}`,
        },
      ],
    };
  }

  async getBestPractices() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              bestPractices: context.bestPractices,
              corePhilosophies: context.corePhilosophies,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getCommonIssues() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.commonIssues, null, 2),
        },
      ],
    };
  }

  async getDependencies() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.dependencies, null, 2),
        },
      ],
    };
  }

  async getWorkflow() {
    const context = await this.loadContext();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context.developmentWorkflow, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LiaiZen Codebase Context MCP Server running on stdio');
  }
}

const server = new CodebaseContextServer();
server.run().catch(console.error);
