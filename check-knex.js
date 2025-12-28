const db = require('./dist/database/connection').default;

async function checkKnexConnection() {
  try {
    console.log('🔍 Checking Knex Database Connection');
    console.log('=====================================');

    // Check what database Knex is using
    const clientConfig = db.client.config;
    console.log('📊 Knex client config:', clientConfig.connection);

    // Test a query
    const tables = await db('sqlite_master')
      .where('type', 'table')
      .select('name');
    console.log(
      '📋 Tables found:',
      tables.map(t => t.name)
    );

    // Check conversations table structure
    const convColumns = await db('conversations').columnInfo();
    console.log('📝 Conversations columns:', convColumns);

    // Check if encryption_key column exists
    const hasEncryptionKey = !!convColumns.encryption_key;
    console.log('🔑 Has encryption_key column:', hasEncryptionKey);

    // Try a test insert
    console.log('\n🧪 Testing conversation creation...');
    const testKey = 'TEST_KEY_' + Date.now();
    const result = await db('conversations')
      .insert({
        type: 'direct',
        created_by: 'test-user-id',
        encryption_key: testKey,
      })
      .returning('*');

    console.log('📝 Insert result:', result[0]);
    console.log('🔑 Key in result:', result[0]?.encryption_key);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

checkKnexConnection()
  .then(() => process.exit(0))
  .catch(console.error);
