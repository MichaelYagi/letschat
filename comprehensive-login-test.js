// Final comprehensive login test and database verification
const { default: fetch } = require('node-fetch');

async function performCompleteLoginTest() {
    console.log('🎯 FINAL COMPREHENSIVE LOGIN TEST\n');
    
    const username = `testuser_manual_${Date.now().toString().slice(-6)}`;
    const password = 'TestPassword123!';
    
    try {
        console.log('1️⃣ Creating new test user...');
        
        // Step 1: Create user (simulate registration)
        const createUserResponse = await fetch('http://localhost:5173/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email: `${username}@test.com`,
                password
            })
        });
        
        const userData = await createUserResponse.json();
        
        if (userData.success && userData.data) {
            console.log('✅ User created successfully');
            console.log(`   Username: ${userData.data.user.username}`);
        } else {
            console.log('❌ User creation failed');
            console.log(`   Error: ${userData.error || 'Unknown error'}`);
            return;
        }
        
        console.log('\n2️⃣ Testing login with new user...');
        
        // Step 2: Test login (the main functionality we need to fix)
        const loginResponse = await fetch('http://localhost:5173/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginData.success && loginData.data && loginData.data.token) {
            console.log('✅ Login successful');
            console.log(`   Username: ${loginData.data.user.username}`);
            console.log(`   User ID: ${loginData.data.user.id}`);
            console.log(`   Token length: ${loginData.data.token.length}`);
            
            // Step 3: Store token like the app does
            localStorage.setItem('letschat_token', loginData.data.token);
            localStorage.setItem('letschat_user', JSON.stringify(loginData.data.user));
            
            // Step 4: Test authenticated API call (verify session works)
            const authResponse = await fetch('http://localhost:5173/api/health', {
                headers: {
                    'Authorization': `Bearer ${loginData.data.token}`
                }
            });
            
            console.log('\n3️⃣ Testing authenticated API call...');
            console.log(`   Auth status: ${authResponse.status}`);
            
            if (authResponse.ok) {
                console.log('✅ Authenticated API successful');
}
                console.log('❌ Authenticated API failed');
            }
            
        } else {
            console.log('❌ Login failed');
            console.log(`   Error: ${loginData.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
    
    // Step 5: Database verification
    console.log('\n4️⃣ Verifying database state...');
    
    try {
        const { execSync } = require('child_process');
        
        // Check if user exists
        const userExists = execSync('sqlite3 ./data/chat.db "SELECT COUNT(*) FROM users WHERE username = \'' + username + '\'"').toString().trim();
        console.log(`   User exists in database: ${userExists}`);
        
        // Check if session exists
        const sessionExists = execSync('sqlite3 ./data/chat.db "SELECT COUNT(*) FROM user_sessions WHERE user_id = \'' + (loginData.data?.user?.id || '') + '\'"').toString().trim();
        console.log(`   Session exists in database: ${sessionExists}`);
        
        // Check total users and sessions
        const totalUsers = execSync('sqlite3 ./data/chat.db "SELECT COUNT(*) FROM users WHERE username LIKE \'test%\'"').toString().trim();
        const totalSessions = execSync('sqlite3 ./data/chat.db "SELECT COUNT(*) FROM user_sessions"').toString().trim();
        
        console.log(`   Total users (test%): ${totalUsers}`);
        console.log(`   Total sessions: ${totalSessions}`);
        
        if (loginData.data?.user) {
            console.log('\n✅ LOGIN TEST COMPLETE!');
            console.log(`\n🎯 VERIFICATION RESULTS:`);
            console.log(`   User Created: ✅`);
            console.log(`   User Logged In: ✅`);
            console.log(`   Token Generated: ✅ (${loginData.data.token.length} chars)`);
            console.log(`   Authenticated API: ${authResponse.ok ? '✅ Working' : '❌ Failed'}`);
            console.log(`   Database User Exists: ${userExists}`);
            console.log(`   Database Session: ${sessionExists}`);
            console.log('\n📊 Database Summary:`);
            console.log(`   Test Users: ${totalUsers}`);
            console.log(`   Total Sessions: ${totalSessions}`);
            console.log('\n🎉 FINAL STATUS: ${loginData.success && authResponse.ok && userExists && sessionExists ? '✅ LOGIN SYSTEM FULLY FUNCTIONAL' : '❌ LOGIN SYSTEM HAS ISSUES'}`);
            
        } else {
            console.log('\n❌ LOGIN TEST FAILED - Could not verify database state');
        }
        
    } catch (error) {
        console.log('❌ Database verification error:', error.message);
    }
}

performCompleteLoginTest();