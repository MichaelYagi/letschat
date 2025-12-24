import db from './src/database/connection.ts';

async function testSearch() {
  try {
    console.log('Testing database connection...');

    // Test basic query
    const users = await db('users')
      .where('username', 'ilike', '%test%')
      .select('id', 'username', 'avatar_url', 'status', 'last_seen')
      .limit(5);

    console.log('Search result:', users);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    process.exit(0);
  }
}

testSearch();
