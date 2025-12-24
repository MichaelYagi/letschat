import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ChatPage } from './components/chat/ChatPage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { UserProfile } from './components/UserProfile';
import { NotificationSettings } from './components/NotificationSettings';
import { MainLayout } from './components/layout/MainLayout';
import { ConversationListWrapper } from './components/wrappers/ConversationListWrapper';
import { Connections } from './components/connections/Connections';
import { RegistrationDebug } from './components/debug/RegistrationDebug';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className='min-h-screen bg-gray-50'>
        {user ? (
          <MainLayout>
            <Routes>
              <Route path='/' element={<ConversationListWrapper />} />
              <Route path='/chat/:conversationId' element={<ChatPage />} />
              <Route path='/friends' element={<Connections />} />
              <Route
                path='/profile'
                element={<UserProfile onClose={() => {}} />}
              />
              <Route
                path='/settings'
                element={<NotificationSettings onClose={() => {}} />}
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </MainLayout>
        ) : (
          <Routes>
            <Route path='/login' element={<LoginForm />} />
            <Route path='/register' element={<RegisterForm />} />
            <Route path='/debug-register' element={<RegistrationDebug />} />
            <Route path='/' element={<Navigate to='/login' replace />} />
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
