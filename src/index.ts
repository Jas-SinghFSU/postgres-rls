import { queryWithTenant, Item } from './db';
import chalk from 'chalk';
import util from 'util';

const tenantA_Id = 'Google';
const tenantB_Id = 'Amazon';

async function main() {
    await runTest('Get everything for Tenant A as Tenant A', async () => {
        const result = await queryWithTenant(tenantA_Id, 'SELECT * FROM items', []);
        assertResultCountAndTenantMatch('Get everything for Tenant A as Tenant A', result.rows, 1000, tenantA_Id);
    });

    await runTest('Get everything for Tenant B as Tenant B', async () => {
        const result = await queryWithTenant(tenantB_Id, 'SELECT * FROM items', []);
        assertResultCountAndTenantMatch('Get everything for Tenant B as Tenant B', result.rows, 1000, tenantB_Id);
    });

    await runTest("Don't pass tenantId and get 0 results back in return", async () => {
        const result = await queryWithTenant(null, 'SELECT * FROM items', []);
        if (result.rowCount === 0) {
            logStatus("Don't pass tenantId and get 0 results back in return", true, `Returned 0 rows as expected.`);
        } else {
            logStatus("Don't pass tenantId and get 0 results back in return", false, `Assertion Failed (Expected 0 rows)`, {
                reason: `Found ${result.rowCount} rows.`,
            });
        }
    });

    await runTest('Try to access Tenant A data as Tenant B (rude)', async () => {
        const result = await queryWithTenant(tenantB_Id, 'SELECT * FROM items WHERE id = $1', [1]);
        if (result.rowCount === 0) {
            logStatus('Try to access Tenant A data as Tenant B (rude)', true, `Returned 0 rows as expected.`);
        } else {
            logStatus('Try to access Tenant A data as Tenant B (rude)', false, `Assertion Failed (Expected 0 rows)`, {
                reason: `Found ${result.rowCount} rows.`,
            });
        }
    });
}

function assertResultCountAndTenantMatch(testName: string, rows: Item[], expectedCount: number, expectedTenantId: string) {
    const allMatchTenant = rows.every(row => row.tenant_id === expectedTenantId);

    if (rows.length === expectedCount && allMatchTenant) {
        logStatus(testName, true, `Found ${rows.length} items.`);
    } else {
        logStatus(testName, false, `Assertion Failed (Expected ${expectedCount} items for ${expectedTenantId})`, {
            reason: `Found ${rows.length} items. All match tenant: ${allMatchTenant}.`,
        });
    }
}

function logStatus(testName: string, success: boolean, summary: string, details?: Record<string, unknown>) {
    const prefix = success
        ? chalk.green.bold('✅ [PASS]')
        : chalk.red.bold('❌ [FAIL]');
    const name = chalk.cyanBright(testName);

    console.log(`${prefix} ${name}: ${summary}`);

    if (details) {
        const detailString = util.inspect(details, { depth: null, colors: true });
        const indentedDetails = detailString.split('\n').map(line => `    ${line}`).join('\n');
        console.log(indentedDetails);
    }
    console.log('');
}

async function runTest(testName: string, testFn: () => Promise<unknown>) {
    const divider = chalk.gray('='.repeat(100));
    console.log(`\n${divider}`);
    console.log(chalk.blueBright.bold(`🧪 Running Test: ${testName}`));
    console.log(`${divider}\n`);
    try {
        await testFn();
    } catch (error: any) {
        logStatus(testName, false, `Unexpected Error`, error);
    }
}

main();
