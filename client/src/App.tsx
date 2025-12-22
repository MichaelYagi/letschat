import { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  MessageCircle,
  Users,
  Menu,
  X,
  Plus,
  Settings,
  User,
} from 'lucide-react';
import { ChatPage } from './components/chat/ChatPage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ConversationList } from './components/chat/ConversationList';
import { NewConversationModal } from './components/chat/NewConversationModal';
import { UserProfile } from './components/UserProfile';
import { NotificationSettings } from './components/NotificationSettings';

function RegisterWrapper() {
  const navigate = useNavigate();
  return (
    <RegisterForm
      onSuccess={() => {
        navigate('/');
      }}
    />
  );
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Routes>
          <Route path='/login' element={<LoginForm />} />
          <Route path='/register' element={<RegisterWrapper />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path='/'
        element={<ConversationList onConversationSelect={() => {}} />}
      />
      <Route
        path='/chat/:conversationId'
        element={<ChatPage conversationId='test' />}
      />
      <Route path='/profile' element={<UserProfile />} />
      <Route
        path='/settings'
        element={<NotificationSettings onClose={() => {}} />}
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const { user } = useAuth();

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNewConversationModalOpen = () => {
    setShowNewConversationModal(true);
  };

  const handleNewConversationModalClose = () => {
    setShowNewConversationModal(false);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Mobile menu overlay - only show when authenticated */}
      {user && mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={handleMobileMenuToggle}
        />
      )}

      {/* Sidebar - Only show when authenticated */}
      {user && (
        <>
          {/* Desktop Sidebar */}
          <div className='hidden lg:flex lg:w-80 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200'>
            {/* Sidebar Header */}
            <div className='p-4 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h1 className='text-xl font-bold text-gray-900 flex items-center'>
                  <MessageCircle className='mr-2 text-primary-600' size={24} />
                  Let's Chat
                </h1>
                <button
                  onClick={handleNewConversationModalOpen}
                  className='p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className='flex-1 p-4'>
              <div className='space-y-2'>
                <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                  <MessageCircle size={18} className='mr-3' />
                  Conversations
                </button>
                <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                  <Users size={18} className='mr-3' />
                  Connections
                </button>
                <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                  <User size={18} className='mr-3' />
                  Profile
                </button>
                <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                  <Settings size={18} className='mr-3' />
                  Settings
                </button>
              </div>
            </nav>
          </div>

          {/* Mobile Header */}
          <div className='lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200'>
            <button
              onClick={handleMobileMenuToggle}
              className='p-2 text-gray-600 hover:text-gray-900'
            >
              <Menu size={24} />
            </button>
            <h1 className='text-lg font-semibold text-gray-900 flex items-center'>
              <MessageCircle className='mr-2 text-primary-600' size={20} />
              Let's Chat
            </h1>
            <button
              onClick={handleNewConversationModalOpen}
              className='p-2 text-gray-600 hover:text-primary-600'
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className='fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden'>
              <div className='p-4 border-b border-gray-200'>
                <button
                  onClick={handleMobileMenuToggle}
                  className='p-2 text-gray-600 hover:text-gray-900'
                >
                  <X size={24} />
                </button>
              </div>
              <nav className='p-4'>
                <div className='space-y-2'>
                  <button
                    onClick={handleMobileMenuToggle}
                    className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <MessageCircle size={18} className='mr-3' />
                    Conversations
                  </button>
                  <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                    <Users size={18} className='mr-3' />
                    Connections
                  </button>
                  <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                    <User size={18} className='mr-3' />
                    Profile
                  </button>
                  <button className='w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'>
                    <Settings size={18} className='mr-3' />
                    Settings
                  </button>
                </div>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <div
        className={
          user ? 'flex-1 flex flex-col overflow-hidden' : 'min-h-screen'
        }
      >
        <AppRoutes />
      </div>

      {/* New Conversation Modal - only when authenticated */}
      {user && showNewConversationModal && (
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={handleNewConversationModalClose}
          onConversationCreated={handleNewConversationModalClose}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
