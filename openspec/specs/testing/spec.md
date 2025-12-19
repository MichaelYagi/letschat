# Testing Strategy

## Testing Philosophy
Comprehensive testing strategy covering unit, integration, and end-to-end testing with security, performance, and accessibility as primary concerns.

## Testing Pyramid

```
    ┌─────────────────┐
    │  E2E Tests      │  <- Critical user journeys
    └─────────────────┘
    ┌─────────────────┐
    │ Integration     │  <- API and component integration
    └─────────────────┘
    ┌─────────────────┐
    │ Unit Tests      │  <- Business logic and utilities
    └─────────────────┘
```

## Unit Testing

### Frontend Unit Tests

#### Component Testing
```typescript
// Example: MessageBubble.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('displays message content correctly', () => {
    const message = {
      id: '1',
      content: 'Hello world',
      sender: { id: '2', username: 'sender' },
      createdAt: '2024-01-01T00:00:00Z',
      isOwn: false
    };

    render(<MessageBubble message={message} isOwn={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows edit button for own messages', () => {
    const message = {
      id: '1',
      content: 'My message',
      sender: { id: '1', username: 'me' },
      createdAt: '2024-01-01T00:00:00Z',
      isOwn: true
    };

    render(<MessageBubble message={message} isOwn={true} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
});
```

#### Hook Testing
```typescript
// Example: useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('useAuth', () => {
  it('logs in user successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        username: 'testuser',
        password: 'password'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('testuser');
  });
});
```

### Backend Unit Tests

#### Service Testing
```typescript
// Example: authService.test.ts
import { AuthService } from './authService';
import { Database } from './database';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = {
      getUserByUsername: jest.fn(),
      createUser: jest.fn(),
      createSession: jest.fn(),
    } as any;
    authService = new AuthService(mockDb);
  });

  it('creates user successfully', async () => {
    const userData = {
      username: 'newuser',
      password: 'securePassword',
      displayName: 'New User'
    };

    mockDb.getUserByUsername.mockResolvedValue(null);
    mockDb.createUser.mockResolvedValue({ id: '1', ...userData });

    const result = await authService.createUser(userData);

    expect(result.success).toBe(true);
    expect(mockDb.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'newuser',
        displayName: 'New User'
      })
    );
  });
});
```

#### Utility Testing
```typescript
// Example: encryption.test.ts
import { encryptMessage, decryptMessage } from './encryption';

describe('Encryption', () => {
  it('encrypts and decrypts message correctly', () => {
    const message = 'Secret message';
    const key = 'encryption-key';

    const encrypted = encryptMessage(message, key);
    const decrypted = decryptMessage(encrypted, key);

    expect(decrypted).toBe(message);
    expect(encrypted).not.toBe(message);
  });
});
```

## Integration Testing

### API Integration Tests

#### Authentication Flow
```typescript
// Example: auth.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { Database } from '../database';

describe('Authentication API', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database(':memory:');
    await db.migrate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers user and returns tokens', async () => {
      const userData = {
        username: 'testuser',
        password: 'SecurePass123',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in registered user', async () => {
      const credentials = {
        username: 'testuser',
        password: 'SecurePass123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
  });
});
```

#### Message Flow Integration
```typescript
describe('Message API', () => {
  let userToken: string;
  let conversationId: string;

  beforeEach(async () => {
    // Setup authenticated user and conversation
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'SecurePass123' });

    userToken = loginResponse.body.data.tokens.accessToken;

    const conversationResponse = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'direct',
        participantUsername: 'otheruser'
      });

    conversationId = conversationResponse.body.data.conversation.id;
  });

  it('sends and retrieves messages', async () => {
    const messageData = {
      content: 'Hello, world!',
      contentType: 'text'
    };

    const sendResponse = await request(app)
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(messageData)
      .expect(201);

    expect(sendResponse.body.data.message.content).toBe(messageData.content);

    const getResponse = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(getResponse.body.data.messages).toHaveLength(1);
    expect(getResponse.body.data.messages[0].content).toBe(messageData.content);
  });
});
```

### Database Integration Tests

#### Schema Testing
```typescript
describe('Database Schema', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database(':memory:');
    await db.migrate();
  });

  it('creates users with required fields', async () => {
    const userData = {
      username: 'testuser',
      passwordHash: 'hashedpassword',
      publicKey: 'publickey',
      privatekeyEncrypted: 'encryptedkey'
    };

    const userId = await db.createUser(userData);
    const user = await db.getUserById(userId);

    expect(user.username).toBe(userData.username);
    expect(user.publicKey).toBe(userData.publicKey);
  });

  it('enforces unique username constraint', async () => {
    const userData = {
      username: 'duplicate',
      passwordHash: 'hashedpassword',
      publicKey: 'publickey',
      privatekeyEncrypted: 'encryptedkey'
    };

    await db.createUser(userData);
    
    await expect(db.createUser(userData)).rejects.toThrow();
  });
});
```

## End-to-End Testing

### User Journey Tests

#### Registration and First Message
```typescript
// e2e/registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Journey', () => {
  test('user can register and send first message', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid=username-input]', 'newuser');
    await page.fill('[data-testid=password-input]', 'SecurePass123');
    await page.fill('[data-testid=displayName-input]', 'New User');
    await page.click('[data-testid=register-button]');

    // Should redirect to chat interface
    await expect(page).toHaveURL('/chat');
    await expect(page.locator('[data-testid=conversation-list]')).toBeVisible();

    // Create first conversation
    await page.click('[data-testid=new-conversation-button]');
    await page.fill('[data-testid=participant-input]', 'existinguser');
    await page.click('[data-testid=create-conversation-button]');

    // Send first message
    await page.fill('[data-testid=message-input]', 'Hello, world!');
    await page.click('[data-testid=send-button]');

    // Verify message appears
    await expect(page.locator('[data-testid=message-content]')).toContainText('Hello, world!');
  });
});
```

#### File Sharing Journey
```typescript
test.describe('File Sharing Journey', () => {
  test('user can upload and preview images', async ({ page }) => {
    // Login and navigate to conversation
    await loginAsUser(page, 'testuser', 'password');
    await page.goto('/chat/c/123');

    // Upload file
    const fileInput = page.locator('[data-testid=file-input]');
    await fileInput.setInputFiles('test-assets/sample-image.jpg');

    // Wait for upload to complete
    await expect(page.locator('[data-testid=upload-progress]')).toHaveValue('100');

    // Verify file appears in message
    await expect(page.locator('[data-testid=message-file]')).toBeVisible();
    await expect(page.locator('[data-testid-file-thumbnail]')).toBeVisible();

    // Click to preview
    await page.click('[data-testid=file-thumbnail]');
    await expect(page.locator('[data-testid=file-preview]')).toBeVisible();
  });
});
```

### Cross-Browser Testing
```typescript
test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`${browserName}: basic messaging works`, async ({ page, browserName }) => {
      // Test basic messaging functionality
      await loginAsUser(page, 'testuser', 'password');
      await sendMessage(page, 'Test message');
      await expect(page.locator('[data-testid=message-content]')).toContainText('Test message');
    });
  });
});
```

## Performance Testing

### Load Testing
```typescript
// tests/load/messaging-load.test.ts
import { load } from 'k6';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let response = http.post('http://localhost:3000/api/v1/auth/login', {
    username: `user${__VU}`,
    password: 'password',
  });

  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  const token = response.json('data.tokens.accessToken');

  response = http.post('http://localhost:3000/api/v1/conversations/123/messages', {
    content: `Load test message ${__VU}-${__ITER}`,
    contentType: 'text',
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(response, {
    'message sent status is 201': (r) => r.status === 201,
    'message response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

### Frontend Performance Tests
```typescript
// tests/performance/rendering.test.ts
import { test, expect } from '@playwright/test';

test.describe('Frontend Performance', () => {
  test('conversation list renders efficiently', async ({ page }) => {
    const startTime = Date.now();
    
    await loginAsUser(page, 'testuser', 'password');
    await page.goto('/chat');
    
    // Wait for conversation list to load
    await page.waitForSelector('[data-testid=conversation-list]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Should load in under 2 seconds

    // Check for large DOM
    const conversationCount = await page.locator('[data-testid=conversation-item]').count();
    expect(conversationCount).toBeGreaterThan(0);

    // Test scrolling performance
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid=conversation-list]');
      if (list) list.scrollTop = 1000;
    });
    const scrollTime = Date.now() - scrollStartTime;
    expect(scrollTime).toBeLessThan(100); // Scroll should be smooth
  });
});
```

## Security Testing

### Authentication Security Tests
```typescript
describe('Authentication Security', () => {
  test('prevents brute force attacks', async () => {
    const credentials = { username: 'testuser', password: 'wrongpassword' };
    
    // Multiple failed attempts
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);
    }

    // Should be rate limited
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(credentials);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
  });

  test('validates JWT tokens properly', async () => {
    const invalidToken = 'invalid.jwt.token';

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
```

### Input Validation Tests
```typescript
describe('Input Validation Security', () => {
  test('prevents XSS in messages', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const userToken = await getAuthToken();

    const response = await request(app)
      .post('/api/v1/conversations/123/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: xssPayload,
        contentType: 'text'
      })
      .expect(201);

    // Message should be sanitized
    expect(response.body.data.message.content).not.toContain('<script>');
  });

  test('validates file uploads', async () => {
    const maliciousFile = Buffer.from('malicious content');

    const response = await request(app)
      .post('/api/v1/files/upload')
      .attach('file', maliciousFile, 'malicious.exe')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Accessibility Testing

### WCAG Compliance Tests
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test('main chat interface is accessible', async ({ page }) => {
    await loginAsUser(page, 'testuser', 'password');
    await page.goto('/chat');

    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('keyboard navigation works', async ({ page }) => {
    await loginAsUser(page, 'testuser', 'password');
    await page.goto('/chat');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test keyboard shortcuts
    await page.keyboard.press('Escape');
    // Verify appropriate escape behavior
  });
});
```

## Test Data Management

### Fixtures and Seeds
```typescript
// tests/fixtures/userFactory.ts
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: faker.datatype.uuid(),
      username: faker.internet.userName(),
      displayName: faker.name.fullName(),
      passwordHash: faker.datatype.string(),
      publicKey: faker.datatype.string(),
      privatekeyEncrypted: faker.datatype.string(),
      ...overrides
    };
  }

  static createMany(count: number): User[] {
    return Array.from({ length: count }, () => this.create());
  }
}
```

### Test Database Setup
```typescript
// tests/helpers/testDatabase.ts
export class TestDatabase {
  private db: Database;

  constructor() {
    this.db = new Database(':memory:');
  }

  async setup(): Promise<void> {
    await this.db.migrate();
    await this.seed();
  }

  async seed(): Promise<void> {
    const users = UserFactory.createMany(10);
    for (const user of users) {
      await this.db.createUser(user);
    }
  }

  async cleanup(): Promise<void> {
    await this.db.close();
  }
}
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Coverage Requirements

### Coverage Goals
- **Unit Tests**: 90% line coverage, 85% branch coverage
- **Integration Tests**: 80% API endpoint coverage
- **E2E Tests**: 100% critical user path coverage
- **Security Tests**: 100% authentication and input validation coverage

### Coverage Reporting
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

## Test Environment Management

### Environment Configuration
```typescript
// tests/config/testConfig.ts
export const testConfig = {
  database: {
    filename: process.env.TEST_DB || ':memory:',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  },
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h',
  },
  encryption: {
    key: 'test-encryption-key-32-chars',
  },
};
```

## Monitoring and Reporting

### Test Result Dashboard
- Real-time test results
- Coverage trends
- Performance benchmarks
- Security scan results
- Accessibility compliance scores

### Automated Reporting
- Daily test summary emails
- Failed test notifications
- Coverage regression alerts
- Performance degradation warnings