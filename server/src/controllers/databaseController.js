const { poolPromise } = require('../config/database');
const { get } = require('../routes/database');

async function listDatabases(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT name
            FROM sys.databases
            WHERE database_id > 4 AND state = 0
            ORDER BY name;
        `);
        const databases = result.recordset.map((r) => r.name);
        res.json({ success: true, data: databases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTableNames(req, res) {
    const dbName = req.params.dbName;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM [${dbName}].INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME != 'sysdiagrams'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        const tables = result.recordset.map((r) => ({
            schema: r.TABLE_SCHEMA,
            name: r.TABLE_NAME,
        }));
        res.json({ success: true, data: tables });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getColumnsNames(req, res) {
    const dbName = req.params.dbName;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                c.TABLE_SCHEMA,
                c.TABLE_NAME,
                c.COLUMN_NAME,
                c.ORDINAL_POSITION,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM [${dbName}].INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    JOIN [${dbName}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                    WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                    AND ku.TABLE_SCHEMA = c.TABLE_SCHEMA
                    AND ku.TABLE_NAME = c.TABLE_NAME
                    AND ku.COLUMN_NAME = c.COLUMN_NAME
                ) THEN 1 ELSE 0 END AS IS_PRIMARY_KEY
            FROM [${dbName}].INFORMATION_SCHEMA.COLUMNS c
            WHERE c.TABLE_NAME <> 'sysdiagrams'
            ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION;
        `);

        const columns = result.recordset.map((r) => ({
            schema: r.TABLE_SCHEMA,
            table: r.TABLE_NAME,
            column: r.COLUMN_NAME,
            isPrimaryKey: !!r.IS_PRIMARY_KEY,
        }));
        res.json({ success: true, data: columns });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getTablesMetadataForDatabase(req, res) {
    const dbName = req.params.dbName;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                t.TABLE_SCHEMA,
                t.TABLE_NAME,
                t.TABLE_TYPE,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.NUMERIC_PRECISION,
                c.NUMERIC_SCALE,
                c.ORDINAL_POSITION,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'YES' ELSE 'NO' END AS IS_PRIMARY_KEY
            FROM [${dbName}].INFORMATION_SCHEMA.TABLES t
            JOIN [${dbName}].INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
            LEFT JOIN (
                SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
                FROM [${dbName}].INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN [${dbName}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) pk ON pk.TABLE_SCHEMA = c.TABLE_SCHEMA AND pk.TABLE_NAME = c.TABLE_NAME AND pk.COLUMN_NAME = c.COLUMN_NAME
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            AND t.TABLE_NAME != 'sysdiagrams'
            ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME, c.ORDINAL_POSITION;
        `);

        const tables = {};
        result.recordset.forEach((row) => {
            const tableKey = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
            if (!tables[tableKey]) {
                tables[tableKey] = {
                    database: dbName,
                    schema: row.TABLE_SCHEMA,
                    tableName: row.TABLE_NAME,
                    tableType: row.TABLE_TYPE,
                    columns: [],
                };
            }
            tables[tableKey].columns.push({
                columnName: row.COLUMN_NAME,
                dataType: row.DATA_TYPE,
                isNullable: row.IS_NULLABLE,
                columnDefault: row.COLUMN_DEFAULT,
                characterMaxLength: row.CHARACTER_MAXIMUM_LENGTH,
                numericPrecision: row.NUMERIC_PRECISION,
                numericScale: row.NUMERIC_SCALE,
                ordinalPosition: row.ORDINAL_POSITION,
                isPrimaryKey: row.IS_PRIMARY_KEY === 'YES',
            });
        });

        res.json({ success: true, data: Object.values(tables) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getDatabaseRelations(req, res) {
    const dbName = req.params.dbName;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                fk.name AS fk_name,
                sch1.name AS referencing_schema,
                tab1.name AS referencing_table,
                col1.name AS referencing_column,
                sch2.name AS referenced_schema,
                tab2.name AS referenced_table,
                col2.name AS referenced_column
            FROM [${dbName}].sys.foreign_keys AS fk
            INNER JOIN [${dbName}].sys.foreign_key_columns AS fkc
                ON fk.object_id = fkc.constraint_object_id
            INNER JOIN [${dbName}].sys.tables AS tab1
                ON fkc.parent_object_id = tab1.object_id
            INNER JOIN [${dbName}].sys.schemas AS sch1
                ON tab1.schema_id = sch1.schema_id
            INNER JOIN [${dbName}].sys.columns AS col1
                ON fkc.parent_object_id = col1.object_id AND fkc.parent_column_id = col1.column_id
            INNER JOIN [${dbName}].sys.tables AS tab2
                ON fkc.referenced_object_id = tab2.object_id
            INNER JOIN [${dbName}].sys.schemas AS sch2
                ON tab2.schema_id = sch2.schema_id
            INNER JOIN [${dbName}].sys.columns AS col2
                ON fkc.referenced_object_id = col2.object_id AND fkc.referenced_column_id = col2.column_id
            ORDER BY referencing_schema, referencing_table, fk.name;
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getGeneralizations(req, res) {
    const dbName = req.params.dbName;
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            USE [${dbName}];
            SELECT 
                fk.name AS fk_name,
                OBJECT_NAME(fk.parent_object_id) AS child_table,
                OBJECT_NAME(fk.referenced_object_id) AS parent_table
            FROM sys.foreign_keys fk
        `);

        const generalizations = {};
        result.recordset.forEach(row => {
            if (!generalizations[row.parent_table]) {
                generalizations[row.parent_table] = [];
            }
            generalizations[row.parent_table].push(row.child_table);
        });

        const output = Object.entries(generalizations)
            .filter(([parent, children]) => children.length > 1)
            .map(([parent, children]) => ({
                supertype: parent,
                subtypes: children
            }));

        res.json({ success: true, data: output });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }

}
            

module.exports = {
    listDatabases,
    getTableNames,
    getColumnsNames,
    getTablesMetadataForDatabase,
    getDatabaseRelations,
    getGeneralizations,
};
