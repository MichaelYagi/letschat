#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chat.db');

async function hashPasswords() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, password FROM users WHERE password_hash IS NULL OR password_hash = ""',
      async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Found ${rows.length} users to update...`);

        for (const user of rows) {
          try {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            db.run(
              'UPDATE users SET password_hash = ? WHERE id = ?',
              [hashedPassword, user.id],
              updateErr => {
                if (updateErr) {
                  console.error(`Failed to update user ${user.id}:`, updateErr);
                } else {
                  console.log(`✅ Updated password for user ${user.id}`);
                }
              }
            );
          } catch (hashErr) {
            console.error(
              `Failed to hash password for user ${user.id}:`,
              hashErr
            );
          }
        }

        setTimeout(() => {
          console.log('Password update complete');
          resolve();
        }, 1000);
      }
    );
  });
}

hashPasswords()
  .then(() => {
    db.close();
  })
  .catch(console.error);
