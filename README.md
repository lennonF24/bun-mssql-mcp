## Config MCP Client

mcp.json

```bun

bun run build
```

```json
{
  "servers": {
    "go-mssql-mcp": {
      "command": "bun",
      "args": ["/absolute/path/to/mcp/server/bun-mssql-mcp"],
      "env": {
        "DB_USER": "user",
        "DB_PASSWORD": "password",
        "DB_NAME": "master",
        "HOST": "localhost",
        "DB_PORT": "1433"
      },
      "type": "stdio"
    }
  },
  "inputs": []
}
```
