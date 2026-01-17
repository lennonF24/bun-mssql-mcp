import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import z from 'zod';

import { executeQueries } from './database/tool';

// const main = async () => {
//   const res = await executeQueries(['SELECT * FROM [dbo].[Clientes]']);
//   console.log('res -------', res);
// };
// main();

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

const transport = new StdioServerTransport();
await server.connect(transport);
