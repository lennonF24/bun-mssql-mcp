import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import z from 'zod';

import { executeQueries, describeTables, getTableSchema, getTableRelationships } from './database/tool';

const server = new McpServer({
  name: 'bun-mssql-mcp',
  version: '0.0.1',
});

server.registerTool(
  'run_queries',
  {
    description: 'Run queries on the database MSSQL',
    inputSchema: {
      queries: z
        .array(z.string())
        .describe('Array of SQL query strings to execute'),
    },
  },
  async ({ queries }) => {
    try {
      const executes = await executeQueries(queries);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(executes, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'describe_tables',
  {
    description: 'List all tables in the current database',
    inputSchema: {},
  },
  async () => {
    try {
      const tables = await describeTables();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_table_schema',
  {
    description: 'Get the schema (columns) of a specific table',
    inputSchema: {
      tableName: z.string().describe('Name of the table to describe'),
      schema: z.string().optional().describe('Schema of the table (default: dbo)'),
    },
  },
  async ({ tableName, schema = 'dbo' }) => {
    try {
      const result = await getTableSchema(tableName, schema);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_table_relationships',
  {
    description: 'Get foreign key relationships for a table',
    inputSchema: {
      tableName: z.string().describe('Name of the table'),
      schema: z.string().optional().describe('Schema of the table (default: dbo)'),
    },
  },
  async ({ tableName, schema = 'dbo' }) => {
    try {
      const result = await getTableRelationships(tableName, schema);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
