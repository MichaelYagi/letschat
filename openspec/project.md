# Project Context

## Purpose
A self-hosted, API-based, mobile-friendly chat application that balances a feature-packed experience with a simple and intuitive UI. Designed primarily for chatting with family and friends, but flexible enough for broader contexts. Emphasis on privacy, security, and customization with open-source transparency and deep code-level extensibility.

## Tech Stack
- **Frontend**: React (or Vue/Angular - to be finalized)
- **Backend**: Node.js with lightweight framework
- **Database**: SQLite for lightweight reliability
- **Real-time**: WebSockets for instant messaging
- **Authentication**: Username/password system
- **Encryption**: End-to-end encryption for all communications
- **Notifications**: Push notification support
- **Deployment**: Cross-platform (Windows, Mac, Linux)

## Project Conventions

### Code Style
- **Formatting**: Prettier for frontend consistency
- **Linting**: ESLint for JavaScript/TypeScript
- **Naming**: camelCase for JavaScript/TypeScript, snake_case for database schemas
- **File Structure**: Modular architecture with clear separation of concerns

### Architecture Patterns
- **Frontend**: Component-based architecture with modern framework
- **Backend**: RESTful API with WebSocket support for real-time features
- **Database**: Relational schema with proper normalization
- **State Management**: Context API or Redux for frontend state
- **Security**: JWT-based authentication with end-to-end encryption

### Testing Strategy
- **Framework**: Jest for unit tests, Supertest for API testing
- **Coverage**: Minimum 80% code coverage
- **Types**: Unit tests for business logic, integration tests for API endpoints, E2E tests for critical user flows
- **Security**: Regular security audits and penetration testing

### Git Workflow
- **Branching**: GitHub Flow with feature branches
- **Commit format**: Conventional commits (feat:, fix:, docs:, etc.)
- **PR requirements**: At least one approval, all tests passing, lint checks passing

## Domain Context
- **User Management**: Registration, login, logout with username/password authentication
- **Messaging**: Real-time text messaging with edit/delete capabilities
- **File Handling**: Image and file sharing with proper validation
- **Connections**: Username-based connections without global directory, accept/reject workflow
- **Group Features**: Group channels with threaded discussions
- **Notifications**: Push notifications for new messages and connection requests
- **Mentions**: @mention system for user tagging
- **Privacy**: End-to-end encryption, self-hosted deployment options

## Important Constraints
- **Performance**: Asynchronous processing, support for multiple concurrent messages, responsive UI
- **Security**: End-to-end encryption mandatory, secure authentication, input validation
- **Cross-platform**: Must run on Windows, Mac, Linux without platform-specific issues
- **Mobile-friendly**: Responsive design, touch-optimized interface
- **Lightweight**: Minimal resource usage, fast startup times
- **Extensibility**: Open APIs for third-party integrations, customizable UI/UX

## External Dependencies
- **Push Notifications**: Service integration for mobile notifications (Firebase or similar)
- **File Storage**: Local file system with proper organization and cleanup
- **Real-time Communication**: WebSocket library for instant messaging
- **Encryption**: Cryptographic library for end-to-end encryption
- **Database**: SQLite with proper connection pooling and migration support
