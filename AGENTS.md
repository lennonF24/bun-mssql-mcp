# MSSQL MCP Server

## Descripción

Servidor MCP (Model Context Protocol) para bases de datos SQL Server. Permite ejecutar queries SQL de solo lectura en bases de datos MSSQL.

## Configuración

El servidor se configura mediante variables de entorno:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_USER` | Usuario de la base de datos | - |
| `DB_PASSWORD` | Contraseña del usuario | - |
| `DB_NAME` | Nombre de la base de datos | master |
| `HOST` | Servidor de la base de datos | localhost |
| `DB_PORT` | Puerto de conexión | 1433 |

## Herramientas disponibles

### run_queries

Ejecuta queries SQL en la base de datos MSSQL.

**Input:**
```typescript
{
  queries: string[]  // Array de queries SQL a ejecutar
}
```

**Ejemplo:**
```json
{
  "queries": ["SELECT TOP 10 * FROM Customers"]
}
```

---

### describe_tables

Lista todas las tablas de la base de datos actual.

**Input:** No requiere parámetros

**Output:**
```typescript
{
  schema: string      // Schema de la tabla (dbo, etc)
  table: string      // Nombre de la tabla
  type: string       // Tipo (TABLE, VIEW)
}[]
```

---

### get_table_schema

Obtiene la estructura (columnas) de una tabla específica.

**Input:**
```typescript
{
  tableName: string  // Nombre de la tabla a describir
  schema?: string    // Schema de la tabla (default: dbo)
}
```

**Output:**
```typescript
{
  column: string           // Nombre de la columna
  type: string             // Tipo de dato SQL
  nullable: boolean        // Permite valores nulos
  isPrimaryKey: boolean    // Es clave primaria
  isForeignKey: boolean    // Es clave foránea
  defaultValue?: string    // Valor por defecto
}[]
```

---

### get_table_relationships

Muestra las relaciones de clave foránea de una tabla.

**Input:**
```typescript
{
  tableName: string  // Nombre de la tabla
  schema?: string    // Schema (default: dbo)
}
```

**Output:**
```typescript
{
  constraintName: string    // Nombre de la restricción FK
  column: string            // Columna FK en esta tabla
  referencedTable: string   // Tabla referenciada
  referencedColumn: string  // Columna PK en la tabla referenciada
}[]
```

---

## Uso con Claude Code

Configurar en `mcp.json`:

```json
{
  "servers": {
    "mssql-mcp": {
      "command": "bun",
      "args": ["/path/to/mssql-mcp/build/index.js"],
      "env": {
        "DB_USER": "tu_usuario",
        "DB_PASSWORD": "tu_password",
        "DB_NAME": "tu_base_datos",
        "HOST": "localhost",
        "DB_PORT": "1433"
      },
      "type": "stdio"
    }
  }
}
```

## Desarrollo

```bash
# Desarrollo con hot-reload
bun run dev

# Build de producción
bun run build
```

## Notas

- Todas las herramientas son de **solo lectura**
- Solo se permite SELECT (no INSERT, UPDATE, DELETE)
- Requiere Bun como runtime