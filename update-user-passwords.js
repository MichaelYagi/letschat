#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/chat.db');

async function updatePasswords() {
  const aliceHash = await bcrypt.hash('password123', 10);
  const bobHash = await bcrypt.hash('password456', 10);

  console.log('Updating Alice password...');
  db.run(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [aliceHash, 'alice'],
    err => {
      if (err) console.error('Alice update error:', err);
      else console.log('✅ Alice password updated');
    }
  );

  console.log('Updating Bob password...');
  db.run(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [bobHash, 'bob'],
    err => {
      if (err) console.error('Bob update error:', err);
      else console.log('✅ Bob password updated');
    }
  );

  setTimeout(() => {
    console.log('Password updates complete');
    db.close();
  }, 100);
}

updatePasswords();
