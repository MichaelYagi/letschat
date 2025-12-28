const db = require('./dist/database/connection').default;
const { EncryptionService } = require('./dist/utils/encryption');

async function testRawSQL() {
  try {
    const testKey = 'TEST_RAW_SQL_' + Date.now();
    const conversationId = EncryptionService.generateUUID();

    console.log('🧪 Testing Raw SQL Insert');
    console.log('=========================');
    console.log('🔑 Test key:', testKey);
    console.log('🆔 Conversation ID:', conversationId);

    const result = await db.raw(
      `
      INSERT INTO conversations (
        id, type, name, description, avatar_url, created_by, 
        encryption_key, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      ) RETURNING *
    `,
      [
        conversationId,
        'direct',
        null,
        null,
        '15f1b745-5c48-4e06-94c8-0290b2014f48',
        testKey,
        new Date(),
        new Date(),
      ]
    );

    console.log('📝 Raw SQL result:', result);

    // Check database
    const dbConv = await db('conversations')
      .where('id', conversationId)
      .first();
    console.log('🗃️  Database result:', {
      hasKey: !!dbConv.encryption_key,
      key: dbConv.encryption_key,
    });
  } catch (error) {
    console.error('❌ Raw SQL error:', error.message);
  } finally {
    await db.destroy();
  }
}

testRawSQL();
