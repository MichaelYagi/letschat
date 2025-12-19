# Project Structure and Organization

## Repository Structure

```
letschat/
├── README.md                          # Project overview and quick start
├── LICENSE                            # Open source license
├── .gitignore                         # Git ignore patterns
├── .env.example                       # Environment variable template
├── docker-compose.yml                 # Docker development setup
├── Dockerfile                         # Production container definition
├── package.json                       # Node.js dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── jest.config.js                     # Test configuration
├── .eslintrc.js                       # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── nginx.conf                         # Nginx reverse proxy config
├── chat-app.service                   # Systemd service file
│
├── src/                               # Application source code
│   ├── server.ts                      # Express server entry point
│   ├── app.ts                         # Application setup and middleware
│   ├── config/                        # Configuration management
│   │   ├── database.ts                # Database configuration
│   │   ├── redis.ts                   # Redis configuration
│   │   ├── jwt.ts                     # JWT configuration
│   │   └── index.ts                   # Configuration exports
│   │
│   ├── database/                      # Database layer
│   │   ├── connection.ts              # Database connection management
│   │   ├── migrations/                # Database migration scripts
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_add_file_uploads.sql
│   │   │   └── 003_add_notifications.sql
│   │   ├── models/                    # Database models and schemas
│   │   │   ├── User.ts                # User model
│   │   │   ├── Message.ts             # Message model
│   │   │   ├── Conversation.ts        # Conversation model
│   │   │   ├── File.ts                # File model
│   │   │   └── index.ts               # Model exports
│   │   └── repositories/              # Data access layer
│   │       ├── UserRepository.ts
│   │       ├── MessageRepository.ts
│   │       ├── ConversationRepository.ts
│   │       └── index.ts
│   │
│   ├── services/                      # Business logic services
│   │   ├── AuthService.ts              # Authentication and authorization
│   │   ├── MessageService.ts          # Message handling
│   │   ├── FileService.ts             # File management
│   │   ├── NotificationService.ts     # Notification handling
│   │   ├── EncryptionService.ts       # Encryption operations
│   │   ├── WebSocketService.ts         # Real-time communication
│   │   └── index.ts                   # Service exports
│   │
│   ├── controllers/                   # API route handlers
│   │   ├── AuthController.ts          # Authentication endpoints
│   │   ├── UserController.ts          # User management endpoints
│   │   ├── MessageController.ts       # Message endpoints
│   │   ├── FileController.ts          # File upload/download endpoints
│   │   ├── NotificationController.ts  # Notification endpoints
│   │   └── index.ts                   # Controller exports
│   │
│   ├── routes/                        # API route definitions
│   │   ├── auth.ts                    # Authentication routes
│   │   ├── users.ts                   # User management routes
│   │   ├── conversations.ts           # Conversation routes
│   │   ├── messages.ts                # Message routes
│   │   ├── files.ts                   # File handling routes
│   │   ├── notifications.ts           # Notification routes
│   │   ├── health.ts                  # Health check routes
│   │   └── index.ts                   # Route aggregation
│   │
│   ├── middleware/                     # Express middleware
│   │   ├── auth.ts                    # JWT authentication
│   │   ├── validation.ts              # Request validation
│   │   ├── rateLimit.ts               # Rate limiting
│   │   ├── errorHandler.ts            # Global error handling
│   │   ├── security.ts                # Security headers
│   │   └── index.ts                   # Middleware exports
│   │
│   ├── types/                         # TypeScript type definitions
│   │   ├── User.ts                    # User-related types
│   │   ├── Message.ts                 # Message-related types
│   │   ├── Conversation.ts            # Conversation-related types
│   │   ├── File.ts                    # File-related types
│   │   ├── Auth.ts                    # Authentication types
│   │   ├── API.ts                     # API request/response types
│   │   └── index.ts                   # Type exports
│   │
│   ├── utils/                         # Utility functions
│   │   ├── encryption.ts              # Cryptographic utilities
│   │   ├── validation.ts              # Input validation helpers
│   │   ├── logger.ts                  # Logging utilities
│   │   ├── helpers.ts                 # General helper functions
│   │   ├── constants.ts               # Application constants
│   │   └── index.ts                   # Utility exports
│   │
│   └── websocket/                     # WebSocket handling
│       ├── handlers/                  # WebSocket event handlers
│       │   ├── messageHandler.ts      # Message events
│       │   ├── typingHandler.ts       # Typing indicators
│       │   ├── presenceHandler.ts     # User presence
│       │   └── index.ts               # Handler exports
│       ├── middleware/                # WebSocket middleware
│       │   ├── auth.ts                # WebSocket authentication
│       │   ├── rateLimit.ts           # Rate limiting for WS
│       │   └── index.ts               # Middleware exports
│       └── index.ts                   # WebSocket setup
│
├── client/                            # Frontend React application
│   ├── public/                        # Static public assets
│   │   ├── index.html                 # HTML template
│   │   ├── favicon.ico                # Favicon
│   │   ├── manifest.json              # PWA manifest
│   │   └── robots.txt                 # SEO robots file
│   │
│   ├── src/                           # Frontend source code
│   │   ├── index.tsx                  # React app entry point
│   │   ├── App.tsx                    # Main App component
│   │   ├── components/                # React components
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── AppLayout.tsx      # Main application layout
│   │   │   │   ├── Header.tsx          # Application header
│   │   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── auth/                  # Authentication components
│   │   │   │   ├── LoginForm.tsx       # Login form
│   │   │   │   ├── RegisterForm.tsx   # Registration form
│   │   │   │   ├── ProtectedRoute.tsx # Route protection
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── chat/                  # Chat-related components
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── ThreadView.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── user/                  # User management components
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── ContactList.tsx
│   │   │   │   ├── UserSearch.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── files/                 # File handling components
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── FilePreview.tsx
│   │   │   │   ├── FileGallery.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── notifications/         # Notification components
│   │   │       ├── NotificationCenter.tsx
│   │   │       ├── NotificationItem.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── pages/                     # Page-level components
│   │   │   ├── LoginPage.tsx           # Login page
│   │   │   ├── RegisterPage.tsx       # Registration page
│   │   │   ├── ChatPage.tsx           # Main chat page
│   │   │   ├── ProfilePage.tsx        # User profile page
│   │   │   └── SettingsPage.tsx       # Settings page
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts             # Authentication state
│   │   │   ├── useChat.ts             # Chat functionality
│   │   │   ├── useWebSocket.ts        # WebSocket connection
│   │   │   ├── useNotifications.ts     # Notification management
│   │   │   ├── useFileUpload.ts       # File upload handling
│   │   │   └── index.ts
│   │   │
│   │   ├── contexts/                  # React context providers
│   │   │   ├── AuthContext.tsx        # Authentication context
│   │   │   ├── ChatContext.tsx        # Chat state context
│   │   │   ├── ThemeContext.tsx       # Theme management
│   │   │   ├── NotificationContext.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── services/                  # Frontend services
│   │   │   ├── api.ts                 # API client
│   │   │   ├── websocket.ts           # WebSocket client
│   │   │   ├── encryption.ts          # Client-side encryption
│   │   │   ├── storage.ts             # Local storage utilities
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                     # Frontend utilities
│   │   │   ├── formatting.ts          # Text and date formatting
│   │   │   ├── validation.ts          # Client-side validation
│   │   │   ├── helpers.ts             # Helper functions
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                     # Frontend TypeScript types
│   │   │   ├── User.ts
│   │   │   ├── Message.ts
│   │   │   ├── Conversation.ts
│   │   │   ├── File.ts
│   │   │   └── index.ts
│   │   │
│   │   └── styles/                    # Styling and themes
│   │       ├── globals.css            # Global CSS styles
│   │       ├── themes/                # Theme definitions
│   │       │   ├── light.css
│   │       │   ├── dark.css
│   │       │   └── index.css
│   │       └── components/            # Component-specific styles
│   │           ├── chat.css
│   │           ├── auth.css
│   │           └── index.css
│   │
│   ├── package.json                   # Frontend dependencies
│   ├── tsconfig.json                  # Frontend TypeScript config
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── vite.config.ts                 # Vite build configuration
│   └── .eslintrc.js                   # Frontend ESLint config
│
├── tests/                             # Test files
│   ├── unit/                          # Unit tests
│   │   ├── services/                  # Service tests
│   │   │   ├── AuthService.test.ts
│   │   │   ├── MessageService.test.ts
│   │   │   └── FileService.test.ts
│   │   ├── utils/                     # Utility tests
│   │   │   ├── encryption.test.ts
│   │   │   ├── validation.test.ts
│   │   │   └── helpers.test.ts
│   │   └── models/                    # Model tests
│   │       ├── User.test.ts
│   │       └── Message.test.ts
│   │
│   ├── integration/                   # Integration tests
│   │   ├── api/                       # API endpoint tests
│   │   │   ├── auth.test.ts
│   │   │   ├── messages.test.ts
│   │   │   ├── files.test.ts
│   │   │   └── conversations.test.ts
│   │   └── database/                  # Database integration tests
│   │       ├── queries.test.ts
│   │       └── migrations.test.ts
│   │
│   ├── e2e/                           # End-to-end tests
│   │   ├── auth.spec.ts               # Authentication flows
│   │   ├── chat.spec.ts               # Chat functionality
│   │   ├── files.spec.ts              # File sharing
│   │   └── mobile.spec.ts             # Mobile-specific tests
│   │
│   ├── fixtures/                      # Test data and fixtures
│   │   ├── users.json                 # Test user data
│   │   ├── messages.json              # Test message data
│   │   └── files/                     # Test file assets
│   │
│   └── helpers/                       # Test utilities
│       ├── testDatabase.ts            # Test database setup
│       ├── mockServer.ts              # Mock API server
│       └── testUtils.ts               # Common test utilities
│
├── scripts/                           # Build and deployment scripts
│   ├── build.sh                       # Build script
│   ├── deploy.sh                      # Deployment script
│   ├── backup.sh                      # Backup script
│   ├── migrate.sh                     # Database migration script
│   ├── seed.sh                        # Database seeding script
│   └── setup-dev.sh                   # Development environment setup
│
├── docs/                              # Documentation
│   ├── api/                           # API documentation
│   │   ├── authentication.md
│   │   ├── messages.md
│   │   ├── files.md
│   │   └── websocket.md
│   ├── deployment/                    # Deployment guides
│   │   ├── docker.md
│   │   ├── manual.md
│   │   └── production.md
│   ├── development/                   # Development guides
│   │   ├── setup.md
│   │   ├── contributing.md
│   │   ├── testing.md
│   │   └── architecture.md
│   └── user/                          # User documentation
│       ├── installation.md
│       ├── configuration.md
│       └── troubleshooting.md
│
├── config/                            # Configuration files
│   ├── nginx.conf                     # Nginx configuration
│   ├── systemd/                       # Systemd service files
│   │   └── chat-app.service
│   ├── docker/                        # Docker configurations
│   │   ├── Dockerfile.dev
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   └── ssl/                           # SSL certificates
│       ├── cert.pem
│       └── key.pem
│
├── data/                              # Runtime data directory
│   ├── uploads/                       # User uploaded files
│   │   ├── images/
│   │   ├── documents/
│   │   └── temp/
│   └── logs/                          # Application logs
│       ├── app.log
│       ├── error.log
│       └── access.log
│
├── openspec/                          # OpenSpec specifications
│   ├── project.md                     # Project conventions
│   ├── specs/                         # Current specifications
│   │   ├── api/
│   │   ├── architecture/
│   │   ├── database/
│   │   ├── deployment/
│   │   ├── frontend/
│   │   └── testing/
│   └── changes/                       # Proposed changes
│       └── add-core-chat-system/
│
└── tools/                             # Development tools
    ├── migration-generator.ts         # Database migration tool
    ├── key-generator.ts               # Encryption key generator
    ├── performance-monitor.ts         # Performance monitoring tool
    └── security-scanner.ts            # Security scanning utility
```

## Component Organization Principles

### Backend Structure

#### Layered Architecture
1. **Controllers**: Handle HTTP requests and responses
2. **Services**: Business logic and orchestration
3. **Repositories**: Data access and database operations
4. **Models**: Data structures and validation
5. **Utils**: Reusable utility functions

#### Service Design
- Single responsibility principle
- Dependency injection
- Interface segregation
- Comprehensive error handling
- Logging and monitoring

### Frontend Structure

#### Component Hierarchy
```
App
├── AppLayout
│   ├── Header
│   │   ├── UserMenu
│   │   └── NotificationCenter
│   └── Sidebar
│       ├── ConversationList
│       └── UserSearch
└── MainContent
    ├── ChatView
    │   ├── MessageList
    │   ├── MessageInput
    │   └── ThreadView
    └── UserProfile
```

#### State Management
- **Global state**: Context API for auth, chat, theme
- **Local state**: useState/useReducer for component state
- **Server state**: Custom hooks for API data
- **Cache state**: React Query or custom caching

## File Naming Conventions

### TypeScript Files
- **Components**: PascalCase (UserProfile.tsx)
- **Utilities**: camelCase (encryptionService.ts)
- **Types**: PascalCase (User.ts)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS.ts)

### Database Files
- **Migrations**: Sequential with description (001_initial_schema.sql)
- **Models**: PascalCase singular (User.ts)
- **Repositories**: PascalCase with Repository suffix (UserRepository.ts)

### Test Files
- **Unit tests**: Same name with .test.ts suffix
- **Integration tests**: Same name with .integration.test.ts suffix
- **E2E tests**: Descriptive with .spec.ts suffix

## Import Organization

### Import Order
```typescript
// 1. Node.js built-ins
import fs from 'fs';
import path from 'path';

// 2. External libraries
import express from 'express';
import { Socket } from 'socket.io';

// 3. Internal modules (absolute imports)
import { UserService } from '@/src/services/UserService';
import { UserRepository } from '@/src/database/repositories/UserRepository';

// 4. Relative imports
import { validateUser } from './validation';
import { UserCreationData } from './types';

// 5. Type-only imports
import type { User } from '@/src/types/User';
```

### Export Patterns
```typescript
// Named exports for most cases
export const UserService = {
  createUser,
  getUserById,
  updateUser,
};

// Default export for main component
export default UserProfile;

// Type exports
export type { User, UserCreationData };
```

## Configuration Management

### Environment Variables
```typescript
// config/index.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || './data/chat.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
};
```

## Build and Deployment Structure

### Production Build Artifacts
```
dist/
├── server.js                        # Compiled backend
├── client/                          # Compiled frontend
│   ├── index.html
│   ├── assets/
│   │   ├── main.js
│   │   ├── main.css
│   │   └── vendor.js
│   └── static/
└── assets/                          # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

### Docker Build Context
```
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage/
.nyc_output/
tests/
*.test.ts
*.spec.ts
openspec/
docs/
tools/
```

## Development Workflow Integration

### Git Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:coverage"
    }
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Test
        run: npm run test:coverage
      
      - name: Build
        run: npm run build
```

## Documentation Structure

### API Documentation
```markdown
<!-- docs/api/auth.md -->
# Authentication API

## Login
POST /api/v1/auth/login

### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {...}
  }
}
```
```

### Component Documentation
```typescript
/**
 * Message Bubble Component
 * 
 * Displays a single message in a conversation with appropriate
 * styling based on sender and message status.
 * 
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isOwn={true}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete
}) => {
  // Component implementation
};
```

## Performance Considerations

### Code Splitting
```typescript
// Dynamic imports for large components
const ChatPage = lazy(() => import('./pages/ChatPage'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Route-based code splitting
const routes = [
  {
    path: '/chat',
    component: lazy(() => import('./pages/ChatPage'))
  },
  {
    path: '/profile',
    component: lazy(() => import('./pages/UserProfile'))
  }
];
```

### Bundle Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'clsx'],
          utils: ['date-fns', 'crypto-js']
        }
      }
    }
  }
});
```

This structure provides a comprehensive, maintainable, and scalable foundation for the chat application while following modern development best practices.