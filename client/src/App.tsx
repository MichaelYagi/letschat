import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ChatPage } from '@/components/chat/ChatPage';
import '@/styles/globals.css';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path='/login'
        element={
          isAuthenticated ? (
            <Navigate to='/chat' replace />
          ) : (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
              <div className='max-w-md w-full px-4'>
                <LoginForm />
              </div>
            </div>
          )
        }
      />
      <Route
        path='/register'
        element={
          isAuthenticated ? (
            <Navigate to='/chat' replace />
          ) : (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
              <div className='max-w-md w-full px-4'>
                <RegisterForm />
              </div>
            </div>
          )
        }
      />
      <Route
        path='/chat'
        element={
          isAuthenticated ? (
            <div className='min-h-screen bg-gray-50 flex'>
              {/* Sidebar placeholder */}
              <div className='w-64 border-r border-gray-200 bg-white'>
                <div className='p-4'>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    Conversations
                  </h2>
                </div>
                <div className='p-4 text-gray-500'>
                  No conversations yet. Start chatting!
                </div>
              </div>

              {/* Main Chat Area */}
              <div className='flex-1 flex flex-col'>
                <ChatPage
                  conversationId='demo-conversation'
                  conversationName='Demo Chat'
                />
              </div>
            </div>
          ) : (
            <Navigate to='/login' replace />
          )
        }
      />
      <Route path='/' element={<Navigate to='/chat' replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
