import React, { useState } from 'react';

export function RegistrationDebug() {
  const [username, setUsername] = useState('testuser6');
  const [password, setPassword] = useState('TestPass123!');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testRegistration = async () => {
    setError(null);
    setResult(null);

    console.log('Starting registration test...');
    console.log('Username:', username);
    console.log('Password:', password);

    try {
      // Test fetch directly first
      console.log('Testing direct fetch...');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response received:', response);
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Registration Debug</h2>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Username:
        </label>
        <input
          type='text'
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Password:
        </label>
        <input
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
        />
      </div>

      <button
        onClick={testRegistration}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Test Registration
      </button>

      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
          }}
        >
          <h3>✅ Success!</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
          }}
        >
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
