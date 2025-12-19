# Frontend Component Specification

## Frontend Architecture Overview
- **Component-based**: React with functional components and hooks
- **State management**: React Context for global state, local state for component-specific data
- **Styling**: Tailwind CSS with custom design system
- **Type safety**: TypeScript with strict mode enabled
- **Performance**: Code splitting, lazy loading, and memoization

## Component Structure

### Application Shell
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout and navigation components
│   ├── auth/                  # Authentication components
│   ├── chat/                  # Chat-related components
│   ├── user/                  # User profile and management
│   ├── files/                 # File handling components
│   └── notifications/         # Notification components
├── pages/                     # Page-level components
├── hooks/                     # Custom React hooks
├── contexts/                  # React context providers
├── services/                  # API and WebSocket services
├── utils/                     # Utility functions
├── types/                     # TypeScript type definitions
└── styles/                    # Global styles and themes
```

## Core Components

### Layout Components

#### AppLayout
Main application layout shell

**Props:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Responsive sidebar navigation
- Header with user menu and notifications
- Mobile-responsive drawer
- Theme switching
- Connection status indicator

#### Sidebar
Navigation sidebar component

**State:**
- isOpen: boolean
- activeSection: string
- unreadCounts: Record<string, number>

**Features:**
- Conversation list with search
- Connection requests indicator
- User status selector
- Mobile swipe gestures

#### Header
Application header component

**Features:**
- Logo and application name
- Global search
- Notification center
- User avatar and menu
- Connection status

### Authentication Components

#### LoginForm
User login form component

**State:**
```typescript
interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}
```

**Features:**
- Form validation
- Loading states
- Error handling
- Password visibility toggle
- Remember me functionality

#### RegisterForm
User registration form component

**Validation:**
- Username uniqueness
- Password strength requirements
- Email format validation
- Terms acceptance

#### ProtectedRoute
Route protection wrapper

**Features:**
- JWT token validation
- Automatic redirect on authentication failure
- Loading state during token validation
- Session timeout handling

### Chat Components

#### ConversationList
List of user conversations

**Props:**
```typescript
interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}
```

**Features:**
- Real-time updates
- Unread message counts
- Online status indicators
- Search and filter
- Infinite scrolling

#### MessageList
Message display component

**Props:**
```typescript
interface MessageListProps {
  messages: Message[];
  currentUser: User;
  loading?: boolean;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}
```

**Features:**
- Auto-scroll to new messages
- Message threading
- Read receipts
- Typing indicators
- Date separators
- Message reactions
- File preview

#### MessageInput
Message composition component

**State:**
```typescript
interface MessageInputState {
  content: string;
  replyTo: Message | null;
  files: File[];
  isTyping: boolean;
}
```

**Features:**
- Rich text input with formatting
- File attachment
- Emoji picker
- @mention suggestions
- Character limit
- Draft saving
- Voice recording (future feature)

#### MessageBubble
Individual message display

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Features:**
- Message status indicators
- Edit/delete controls for own messages
- Reaction display and addition
- File preview integration
- Link preview generation

### User Components

#### UserProfile
User profile display and editing

**Props:**
```typescript
interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  isEditing: boolean;
  onUpdate: (data: Partial<User>) => void;
}
```

**Features:**
- Avatar upload and crop
- Display name editing
- Status management
- Settings integration
- QR code for username sharing

#### ContactList
User's contact management

**Features:**
- Connection requests
- Online status
- Search and filter
- Bulk actions
- Import/export contacts

#### UserSearch
User discovery component

**Features:**
- Real-time username search
- Results caching
- Search history
- Advanced filters

### File Components

#### FileUpload
File upload component

**Props:**
```typescript
interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxSize: number;
  allowedTypes: string[];
  multiple: boolean;
}
```

**Features:**
- Drag and drop
- Progress tracking
- Preview generation
- Validation and error handling
- Multiple file selection

#### FilePreview
File preview and display

**Props:**
```typescript
interface FilePreviewProps {
  file: FileInfo;
  onDownload: () => void;
  onDelete: () => void;
}
```

**Features:**
- Image thumbnail gallery
- Document preview
- Video player integration
- Metadata display
- Share functionality

#### FileGallery
Gallery view for multiple files

**Features:**
- Grid/list view toggle
- Sorting and filtering
- Selection mode
- Bulk operations

### Notification Components

#### NotificationCenter
Central notification management

**Features:**
- Notification list with pagination
- Mark as read/unread
- Notification categories
- Search and filter
- Settings integration

#### NotificationItem
Individual notification display

**Props:**
```typescript
interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}
```

**Features:**
- Rich content rendering
- Action buttons
- Timestamp display
- Priority indicators

## Custom Hooks

### useAuth
Authentication state management

```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

### useChat
Chat functionality and state

```typescript
interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  editMessage: (id: string, content: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}
```

### useWebSocket
WebSocket connection management

```typescript
interface UseWebSocketReturn {
  connected: boolean;
  socket: Socket | null;
  joinConversation: (id: string) => void;
  leaveConversation: (id: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}
```

### useNotifications
Notification management

```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}
```

### useFileUpload
File upload functionality

```typescript
interface UseFileUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadFile: (file: File, conversationId: string) => Promise<FileInfo>;
}
```

## State Management

### AuthContext
Global authentication state

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

### ChatContext
Global chat state

```typescript
interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Set<string>>;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
}
```

### ThemeContext
Theme and appearance management

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setPrimaryColor: (color: string) => void;
}
```

## Responsive Design

### Breakpoints
```typescript
const breakpoints = {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
};
```

### Mobile Adaptations
- Collapsible sidebar
- Bottom navigation on mobile
- Touch-optimized message input
- Swipe gestures for navigation
- Mobile file picker integration

## Performance Optimizations

### Code Splitting
```typescript
// Lazy loading for heavy components
const ChatPage = lazy(() => import('./pages/ChatPage'));
const UserProfile = lazy(() => import('./components/user/UserProfile'));
```

### Memoization
- React.memo for pure components
- useMemo for expensive calculations
- useCallback for event handlers
- Virtual scrolling for long lists

### Bundle Optimization
- Tree shaking for unused code
- Dynamic imports for features
- Image optimization and lazy loading
- Service worker for caching

## Accessibility

### WCAG 2.1 Compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme option

### Focus Management
- Focus traps for modals
- Skip navigation links
- Visible focus indicators
- Logical tab order

## Testing Strategy

### Component Testing
- Unit tests with React Testing Library
- Integration tests for user flows
- Visual regression testing
- Accessibility testing

### Performance Testing
- Component render performance
- Memory usage monitoring
- Bundle size analysis
- Core Web Vitals optimization

## Internationalization

### Multi-language Support
- i18n framework integration
- RTL language support
- Date/time localization
- Number and currency formatting

### Implementation
```typescript
interface I18nContextType {
  locale: string;
  t: (key: string, options?: Record<string, any>) => string;
  changeLocale: (locale: string) => void;
}
```