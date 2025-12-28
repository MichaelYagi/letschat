// Simple test script to verify group chat functionality
// Run this in browser console on the chat page

console.log('🧪 Testing Group Chat Functionality...');

// Test 1: Check if modal opens
const newConversationBtn =
  document.querySelector('[data-testid="new-conversation-btn"]') ||
  document.querySelector('button[aria-label*="New Conversation"]') ||
  document.querySelector('button:contains("New Conversation")');

if (newConversationBtn) {
  console.log('✅ Found new conversation button');
  newConversationBtn.click();

  setTimeout(() => {
    // Test 2: Check if modal opened
    const modal =
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.fixed.inset-0');

    if (modal) {
      console.log('✅ Modal opened successfully');

      // Test 3: Find group chat radio button
      const groupRadio = document.querySelector('input[value="group"]');
      if (groupRadio) {
        console.log('✅ Found group chat radio button');
        groupRadio.click();

        setTimeout(() => {
          // Test 4: Check if group fields are visible
          const groupNameInput = document.querySelector('#groupName');
          const participantsInput = document.querySelector('#participants');

          if (groupNameInput && participantsInput) {
            console.log('✅ Group chat fields are visible');

            // Test 5: Fill group name
            groupNameInput.value = 'Test Group';
            groupNameInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Group name filled');

            // Test 6: Try searching for users
            participantsInput.value = 'test';
            participantsInput.dispatchEvent(
              new Event('input', { bubbles: true })
            );
            console.log('🔍 Started user search...');

            // Test 7: Check search results after delay
            setTimeout(() => {
              const searchResults = document.querySelector(
                '.border.border-gray-200'
              );
              if (searchResults) {
                console.log('✅ Search results container found');
                console.log(
                  '📥 Search results HTML:',
                  searchResults.innerHTML.substring(0, 200)
                );
              } else {
                console.log('❌ No search results found');
              }

              // Test 8: Check create button status
              const createBtn = document.querySelector('button[type="submit"]');
              if (createBtn) {
                console.log('✅ Create button found');
                console.log('🔘 Button disabled:', createBtn.disabled);
                console.log('🎯 Button classes:', createBtn.className);

                // Test 9: Add a fake participant to enable button
                const fakeUsername = 'testuser';
                console.log('👤 Simulating adding participant:', fakeUsername);

                // Simulate adding participant by calling the function directly
                window.testAddParticipant = username => {
                  console.log('➕ Would add participant:', username);
                };

                if (createBtn.disabled) {
                  console.log('❌ Create button is still disabled');
                  console.log('🔍 Current form state:');
                  console.log('  - Group name:', groupNameInput.value);
                  console.log('  - Participants:', 'Check participants array');
                } else {
                  console.log('✅ Create button is enabled');
                }
              } else {
                console.log('❌ Create button not found');
              }
            }, 2000);
          } else {
            console.log('❌ Group chat fields not found');
          }
        }, 500);
      } else {
        console.log('❌ Group chat radio button not found');
      }
    } else {
      console.log('❌ Modal did not open');
    }
  }, 500);
} else {
  console.log('❌ New conversation button not found');
  console.log(
    'Available buttons:',
    Array.from(document.querySelectorAll('button')).map(
      b => b.textContent || b.innerText
    )
  );
}

console.log('🏁 Test complete. Check console for detailed results.');
