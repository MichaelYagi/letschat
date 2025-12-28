const db = require('./dist/database/connection').default;
const { EncryptionService } = require('./dist/utils/encryption');

async function simpleTest() {
  try {
    // Clear and test simple
    await db('conversations').del();

    const key = 'SIMPLE_TEST_KEY';
    const id = EncryptionService.generateUUID();

    console.log('🧪 Simple Test');
    console.log('=================');
    console.log('🔑 Key:', key);
    console.log('🆔 ID:', id);

    const result = await db('conversations')
      .insert({
        id: id,
        type: 'direct',
        created_by: 'test-user',
        encryption_key: key,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    console.log('📝 Result:', result[0]);

    // Check database
    const dbConv = await db('conversations').where('id', id).first();
    console.log('🗃️  DB check:', {
      hasKey: !!dbConv.encryption_key,
      key: dbConv.encryption_key,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

simpleTest();
