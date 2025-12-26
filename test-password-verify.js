#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testPassword() {
  const plainPassword = 'password123';
  const storedHash =
    '$2a$10$rOTzWsTCVda5n7sJO3NWxuzkMg2M6qEqjwfGQNUZzEfOwXq/XAQBm';

  console.log('Testing password verification...');
  console.log('Plain password:', plainPassword);
  console.log('Stored hash:', storedHash);

  try {
    const isValid = await bcrypt.compare(plainPassword, storedHash);
    console.log('Password verification result:', isValid);

    // Test creating new hash
    const newHash = await bcrypt.hash(plainPassword, 10);
    console.log('New hash would be:', newHash);

    const isNewValid = await bcrypt.compare(plainPassword, newHash);
    console.log('New hash verification:', isNewValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();
