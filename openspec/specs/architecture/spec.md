# System Architecture

## Overview
A self-hosted, real-time chat application built with modern web technologies, emphasizing security, scalability, and maintainability.

## Architecture Pattern
- **Microservices-ready monolith**: Initially deployed as single service but designed with clear service boundaries
- **Event-driven architecture**: Uses WebSocket for real-time communication with event sourcing for message history
- **Secure by design**: End-to-end encryption with zero-knowledge architecture principles

## Core Components

### Backend Services
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  WebSocket Hub  │    │ File Service   │
│                 │    │                 │    │                 │
│ • Auth middleware│    │ • Real-time     │    │ • Upload/Download│
│ • Rate limiting │    │ • Message routing│    │ • Validation    │
│ • Request routing│    │ • Presence      │    │ • Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Auth Service    │    │ Message Service │    │ User Service    │
│                 │    │                 │    │                 │
│ • JWT tokens    │    │ • Encryption    │    │ • Profiles      │
│ • Password hash │    │ • Thread mgmt   │    │ • Connections   │
│ • Session mgmt  │    │ • Search        │    │ • Discovery     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Auth Context │  │ Chat Context │  │ UI Context   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages     │  │ Components   │  │   Hooks      │       │
│  │             │  │             │  │             │       │
│  │ • Login     │  │ • Message   │  │ • useAuth   │       │
│  │ • Chat      │  │ • File      │  │ • useChat   │       │
│  │ • Profile   │  │ • User      │  │ • useSocket │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Utils     │  │  Services    │  │   Styles     │       │
│  │             │  │             │  │             │       │
│  │ • Crypto    │  │ • API       │  │ • Themes     │       │
│  │ • Validation│  │ • WebSocket │  │ • Responsive │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Message Flow
1. **Client**: User types message → Client encrypts → WebSocket send
2. **Server**: Receive encrypted message → Validate → Store encrypted → Forward to recipients
3. **Recipients**: WebSocket receive → Client decrypts → Display in UI

### File Upload Flow
1. **Client**: File selection → Client validation → Upload request
2. **Server**: Receive file → Security scan → Store → Generate share URL
3. **Distribution**: Add file message to relevant conversations

### Authentication Flow
1. **Login**: Credentials → Server validation → JWT generation → Secure storage
2. **Request**: JWT header → Middleware validation → Route processing
3. **Refresh**: Access token expiry → Refresh token → New access token

## Security Architecture

### Encryption Layers
- **Transport Layer**: TLS 1.3 for all network communication
- **Application Layer**: AES-256-GCM for message content
- **Storage Layer**: Encrypted database with per-user keys
- **Key Management**: ECDH key exchange with perfect forward secrecy

### Trust Model
- **Zero-knowledge**: Server never has access to plaintext messages
- **Client-side encryption**: All encryption/decryption happens on client
- **Key rotation**: Automatic key rotation with backward compatibility

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: API services designed for horizontal scaling
- **Connection pooling**: Database and Redis connection management
- **Load balancing**: WebSocket connections distributed across instances

### Performance Optimization
- **Database indexing**: Optimized queries for message retrieval
- **Caching strategy**: Redis for session data and frequent lookups
- **Message batching**: Efficient WebSocket message delivery

### Resource Management
- **Connection limits**: Per-user and total connection limits
- **File storage**: Automatic cleanup and storage quotas
- **Memory management**: Efficient message buffering and cleanup

## Deployment Architecture

### Container Strategy
```
┌─────────────────┐
│   Reverse Proxy │ (nginx/caddy)
│   • SSL/TLS     │
│   • Load balance│
└─────────────────┘
         │
┌─────────────────┐
│   Application   │ (Node.js container)
│   • API Server  │
│   • WebSocket   │
│   • File Service│
└─────────────────┘
         │
┌─────────────────┐
│   Database      │ (SQLite with WAL)
│   • Messages    │
│   • Users       │
│   • Files       │
└─────────────────┘
```

### Self-Hosting Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 100GB SSD storage
- **Network**: HTTPS required for secure communications

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware
- **WebSocket**: Socket.io for real-time communication
- **Database**: SQLite with better-sqlite3 for performance
- **Caching**: Redis for session management
- **File Storage**: Local filesystem with organized directories

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Context + useReducer
- **Routing**: React Router for SPA navigation
- **UI Library**: Tailwind CSS with custom components
- **WebSocket**: Socket.io client
- **Cryptography**: Web Crypto API + libsodium wrapper

### Development Tools
- **Build**: Vite for fast development and builds
- **Testing**: Jest + React Testing Library + Supertest
- **Linting**: ESLint + Prettier with consistent configurations
- **Type Checking**: TypeScript strict mode
- **Bundling**: Optimized production builds with tree shaking

## Monitoring and Observability

### Logging Strategy
- **Structured logging**: JSON format with consistent fields
- **Log levels**: ERROR, WARN, INFO, DEBUG with appropriate usage
- **Security events**: Separate security audit logs
- **Performance metrics**: Request timing and database queries

### Health Monitoring
- **Health endpoints**: `/health` for service status
- **Metrics collection**: Custom metrics for business operations
- **Error tracking**: Centralized error handling and reporting
- **Performance monitoring**: Response times and resource usage

## Development Workflow

### Environment Setup
- **Development**: Hot reload with mock data for offline development
- **Testing**: Comprehensive test suite with CI/CD integration
- **Staging**: Production-like environment for final testing
- **Production**: Optimized builds with security hardening

### Code Organization
- **Feature-based structure**: Organized by capability, not file type
- **Shared libraries**: Common utilities and components
- **Configuration management**: Environment-specific settings
- **API contracts**: OpenAPI specification for all endpoints