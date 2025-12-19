## ADDED Requirements

### Requirement: Real-time Messaging
The system SHALL enable real-time message exchange between connected users with end-to-end encryption.

#### Scenario: Send message
- **WHEN** a user sends a message to another user
- **THEN** the message is encrypted client-side and delivered instantly
- **AND** recipient receives notification of new message

#### Scenario: Receive message
- **WHEN** a user receives an encrypted message
- **THEN** the system decrypts and displays the message content
- **AND** updates the conversation history

#### Scenario: Offline delivery
- **WHEN** a recipient is offline when message is sent
- **THEN** the system stores the message securely
- **AND** delivers when user comes back online

### Requirement: Message Edit and Delete
The system SHALL allow users to edit or delete their own messages within a time window.

#### Scenario: Edit message
- **WHEN** a user edits their own message within the allowed time
- **THEN** the message content is updated for all participants
- **AND** an edit indicator is shown

#### Scenario: Delete message
- **WHEN** a user deletes their own message within the allowed time
- **THEN** the message is removed from all participants' views
- **AND** a deletion placeholder may be shown

#### Scenario: Time limit enforcement
- **WHEN** a user attempts to edit/delete after time limit
- **THEN** the operation is rejected with appropriate error

### Requirement: Message Status
The system SHALL provide delivery and read status for messages.

#### Scenario: Message delivered
- **WHEN** a message is successfully delivered to recipient
- **THEN** the sender sees delivery confirmation

#### Scenario: Message read
- **WHEN** the recipient opens and reads a message
- **THEN** the sender sees read confirmation
- **AND** recipient can disable read receipts if desired

### Requirement: @mention System
The system SHALL support user mentions within messages for direct notifications.

#### Scenario: User mention
- **WHEN** a user includes @username in a message
- **THEN** the mentioned user receives special notification
- **AND** the mention is highlighted in the message

#### Scenario: Invalid mention
- **WHEN** a user mentions a non-existent username
- **THEN** the mention is not linked but displayed as text

### Requirement: Message Search
The system SHALL allow users to search their message history with encryption considerations.

#### Scenario: Text search
- **WHEN** a user searches for text in messages
- **THEN** the system searches decrypted content for authorized messages
- **AND** returns relevant results with context

#### Scenario: Date filtering
- **WHEN** a user filters messages by date range
- **THEN** the system returns messages within the specified timeframe