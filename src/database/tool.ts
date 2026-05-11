import { prisma } from './connection';

export const executeQueries = async (query: string[]) => {
  const executed = [];
  for (const q of query) {
    const res = await prisma.$queryRawUnsafe(q);
    executed.push(res);
  }

  return executed;
};

interface TableInfo {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
}

export const describeTables = async (): Promise<TableInfo[]> => {
  const result = await prisma.$queryRawUnsafe<TableInfo[]>(`
    SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
    ORDER BY TABLE_SCHEMA, TABLE_NAME
  `);
  return result;
};

interface ColumnInfo {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
  ORDINAL_POSITION: number;
}

interface KeyConstraint {
  COLUMN_NAME: string;
  CONSTRAINT_NAME: string;
  CONSTRAINT_TYPE: string;
}

export const getTableSchema = async (
  tableName: string,
  schema: string = 'dbo',
): Promise<{
  columns: {
    column: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    defaultValue?: string;
  }[];
}> => {
  const columns = await prisma.$queryRawUnsafe<ColumnInfo[]>(
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, ORDINAL_POSITION
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = @tableName AND TABLE_SCHEMA = @schema
     ORDER BY ORDINAL_POSITION`,
    { tableName, schema },
  );

  const primaryKeys = await prisma.$queryRawUnsafe<KeyConstraint[]>(
    `SELECT cu.COLUMN_NAME, cu.CONSTRAINT_NAME, cu.CONSTRAINT_TYPE
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
     JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
       ON tc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
     WHERE tc.TABLE_NAME = @tableName
       AND tc.TABLE_SCHEMA = @schema
       AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'`,
    { tableName, schema },
  );

  interface ForeignKeyCol {
    COLUMN_NAME: string;
    CONSTRAINT_NAME: string;
    TABLE_NAME: string;
    REFERENCED_COLUMN_NAME: string;
  }

  const foreignKeys = await prisma.$queryRawUnsafe<ForeignKeyCol[]>(
    `SELECT 
       kcu.COLUMN_NAME,
       kcu.CONSTRAINT_NAME,
       kcu.TABLE_NAME,
       kcu.COLUMN_NAME AS REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
       ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     WHERE kcu.TABLE_NAME = @tableName AND kcu.TABLE_SCHEMA = @schema`,
    { tableName, schema },
  );

  const pkColumns = new Set(primaryKeys.map((pk) => pk.COLUMN_NAME));
  const fkColumns = new Set(foreignKeys.map((fk) => fk.COLUMN_NAME));

  return {
    columns: columns.map((col) => ({
      column: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      nullable: col.IS_NULLABLE === 'YES',
      isPrimaryKey: pkColumns.has(col.COLUMN_NAME),
      isForeignKey: fkColumns.has(col.COLUMN_NAME),
      defaultValue: col.COLUMN_DEFAULT ?? undefined,
    })),
  };
};

interface ForeignKeyInfo {
  CONSTRAINT_NAME: string;
  COLUMN_NAME: string;
  TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
}

export const getTableRelationships = async (
  tableName: string,
  schema: string = 'dbo',
): Promise<{
  relationships: {
    constraintName: string;
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
}> => {
  const fks = await prisma.$queryRawUnsafe<ForeignKeyInfo[]>(
    `SELECT 
       rc.CONSTRAINT_NAME,
       kcu.COLUMN_NAME,
       kcu2.TABLE_NAME AS TABLE_NAME,
       kcu2.COLUMN_NAME AS REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
       ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu2
       ON rc.UNIQUE_CONSTRAINT_NAME = kcu2.CONSTRAINT_NAME
     WHERE kcu.TABLE_NAME = @tableName AND kcu.TABLE_SCHEMA = @schema`,
    { tableName, schema },
  );

  return {
    relationships: fks.map((fk) => ({
      constraintName: fk.CONSTRAINT_NAME,
      column: fk.COLUMN_NAME,
      referencedTable: fk.TABLE_NAME,
      referencedColumn: fk.REFERENCED_COLUMN_NAME,
    })),
  };
};
