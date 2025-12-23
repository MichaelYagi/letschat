import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkExistingUsers() {
  try {
    const db = await open({
      filename: './data/chat.db',
      driver: sqlite3.Database,
    });

    const users = await db.all(
      'SELECT id, username, email, status FROM users LIMIT 10'
    );
    console.log('Existing users:');
    users.forEach(user => {
      console.log(
        `- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Status: ${user.status}`
      );
    });

    await db.close();
  } catch (error) {
    console.log('Database error:', error.message);
  }
}

checkExistingUsers();
