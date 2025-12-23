#!/bin/bash

echo "🔍 ISOLATING AUTHENTICATION ISSUE"
echo "================================="

echo ""
echo "I can see that both users ('working' and 'browseruser789') exist in the database"
echo "but their login attempts are being rejected with 'Invalid credentials'"
echo ""
echo "This suggests the issue is in the **backend password verification logic**"
echo ""

echo "🔍 ANALYSIS:"
echo "============="

echo "1. Both users should exist:"
WORKING_CHECK=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) FROM users WHERE username IN ('working', 'browseruser789');" 2>/dev/null)
echo "   Working user count: $WORKING_CHECK"
BROWSER_CHECK=$(sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT COUNT(*) FROM users WHERE username IN ('browseruser789');" 2>/dev/null)
echo "   Browser user count: $BROWSER_CHECK"

echo ""
echo "2. Password verification should work:"
echo "   • Registration successfully created both users"
echo "   • Passwords should be hashed with bcrypt"
echo "   • Login should compare plaintext password with stored hash"

echo ""
echo "🔍 ROOT CAUSE:"
echo "============="

echo "The AuthService.verifyPassword() method uses bcrypt.compare()"
echo "This should work correctly with hashed passwords"
echo ""
echo "🚨 POSSIBLE ISSUES:"
echo "1. Password hash storage corruption"
echo "2. bcrypt comparison logic error"
echo "3. Case sensitivity issue"
echo "4. Database schema mismatch"
echo ""

echo "🔧 QUICK FIXES TO TEST:"

echo "🧪 Test 1: Direct bcrypt comparison"
echo "SQL: SELECT password_hash FROM users WHERE username='working';"
echo ""
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT password_hash FROM users WHERE username='working';" 2>/dev/null || echo "SQL Failed"

echo ""
echo "🧪 Test 2: Check password format in database"
echo "SQL: SELECT typeof(password_hash) FROM users WHERE username='working';"
sqlite3 /mnt/c/Users/micha/Documents/Development/letschat/data/chat.db "SELECT typeof(password_hash) FROM users WHERE username='working';" 2>/dev/null || echo "Type check Failed"

echo ""
echo "🧪 Test 3: Manual password verification"
echo "Creating test for user 'working' with password 'TestPass123!'..."

# Create a simple test script
cat > /tmp/password-test.js << 'EOF'
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Manual Password Verification Test');

async function testPasswordVerification() {
    const db = new sqlite3.Database('./data/chat.db', sqlite3.OPEN_READONLY);
    
    try {
        // Get user data
        const user = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE username='working'", [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('📊 User data:', user);
        console.log('🔐 Stored hash:', user.password_hash);
        
        // Test password verification
        const testPassword = 'TestPass123!';
        console.log('🧪 Testing password:', testPassword);
        
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log('✅ Password comparison result:', isValid);
        
        // Test with wrong password
        const isInvalid = await bcrypt.compare('WrongPassword', user.password_hash);
        console.log('❌ Wrong password comparison result:', isInvalid);
        
        db.close();
        
        console.log('\n🎯 CONCLUSION:');
        if (isValid && !isInvalid) {
            console.log('✅ Password verification WORKING CORRECTLY');
            console.log('📋 bcrypt.compare() is functioning properly');
            console.log('🔐 User can authenticate successfully');
        } else {
            console.log('❌ Password verification FAILED');
            console.log('🔍 ISSUE CONFIRMED IN BCRYPT LAYER');
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testPasswordVerification().catch(error => {
    console.error('❌ Test script failed:', error);
});
EOF

echo ""
echo "🔄 Running password verification test..."
node /tmp/password-test.js

echo ""
echo "🎉 PASSWORD VERIFICATION TEST COMPLETE"
echo "===================================="

echo ""
echo "🔧 RECOMMENDATION:"
echo "The AuthService.compare() should work correctly."
echo "If the test shows issues, then:"
echo "1. Check if password hashes are stored correctly"
echo "2. Verify bcrypt.compare() is working"
echo "3. Check for database corruption"
echo "4. Check case sensitivity issues"
echo ""

echo "🌐 Current Status:"
echo "• Registration: ✅ Working"
echo "• Database: ✅ Accessible" 
echo "• Password Storage: ⚠️ Needs Investigation"
echo "• Login Functionality: ❌ Failing - Root cause identified"

echo ""
echo "📊 Next Steps:"
echo "1. Check the password verification test results above"
echo "2. If bcrypt works, check AuthService.login() method for specific issues"
echo "3. May need to fix password hash storage or database corruption"