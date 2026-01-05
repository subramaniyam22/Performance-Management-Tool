const { Client } = require('pg');

async function testConnection(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log(`✅ Connected successfully to ${config.database || 'postgres'} on port ${config.port}`);

        // List databases
        const result = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
        console.log('\nAvailable databases:');
        result.rows.forEach(row => console.log(`  - ${row.datname}`));

        await client.end();
        return true;
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        await client.end().catch(() => { });
        return false;
    }
}

async function main() {
    console.log('Testing database connections...\n');

    // Test configurations
    const configs = [
        {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'performance123',
            database: 'postgres'
        },
        {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'postgres',
            database: 'postgres'
        },
        {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '',
            database: 'postgres'
        }
    ];

    for (const config of configs) {
        console.log(`\nTrying: postgres://${config.user}:${'*'.repeat(config.password.length)}@${config.host}:${config.port}/${config.database}`);
        const success = await testConnection(config);
        if (success) {
            console.log('\n✅ Found working credentials!');
            break;
        }
    }
}

main().catch(console.error);
