import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
    user: 'app_user',
    password: 'app_password',
    host: 'localhost',
    port: 6432,
    database: 'gobirds',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

export async function queryWithTenant(tenantId: TenantId, sql: string, params: unknown[] = []): Promise<QueryResult> {
    const client = await pool.connect();
    console.log(`Executing query for tenant: ${tenantId ?? 'NONE'}`);
    console.log(`SQL Query: ${sql} PARAMS: ${JSON.stringify(params)}`);

    try {
        await client.query(SQL_TRANSACTION.BEGIN);

        const sqlContext = setTenantId(tenantId, client)

        await client.query(sqlContext);

        const result = await client.query(sql, params);

        await client.query(SQL_TRANSACTION.COMMIT);

        console.log(`\nQuery successful for tenant: ${tenantId ?? 'NONE'}. Rows: ${result.rowCount}\n`);

        return result;
    } catch (error) {
        console.error(`Error during transaction for tenant ${tenantId ?? 'NONE'}:`, error);
        throw error;
    } finally {
        client.release();
    }
}

function setTenantId(tenantId: string | null, client: PoolClient): string {
    if (tenantId === null) {
        return `SET LOCAL app.current_tenant_id = ''`;
    } else {
        const escapedTenantId = client.escapeLiteral(tenantId);

        return `SET LOCAL app.current_tenant_id = ${escapedTenantId}`;
    }
}

type TenantId = string | null;

enum SQL_TRANSACTION {
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT'
};

export interface Item extends QueryResultRow {
    id: number;
    name: string;
    tenant_id: string;
}
