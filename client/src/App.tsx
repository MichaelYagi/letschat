import React, { useState } from 'react';
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
import { ConversationList } from '@/components/chat/ConversationList';
import { NewConversationModal } from '@/components/chat/NewConversationModal';
import { UserConnections } from '@/components/chat/UserConnections';
import { Notifications } from '@/components/chat/Notifications';
import { Message, Settings, Bell, Users, Menu, X } from 'lucide-react';
import '@/styles/globals.css';

type ViewType = 'chat' | 'connections' | 'notifications';

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>();
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path='/login'
          element={
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
              <div className='max-w-md w-full px-4'>
                <LoginForm />
              </div>
            </div>
          }
        />
        <Route
          path='/register'
          element={
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
              <div className='max-w-md w-full px-4'>
                <RegisterForm />
              </div>
            </div>
          }
        />
        <Route path='/' element={<Navigate to='/chat' replace />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    );
  }

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView('chat');
    setShowMobileMenu(false);
  };

  const renderSidebar = () => {
    switch (currentView) {
      case 'connections':
        return <UserConnections />;
      case 'notifications':
        return <Notifications />;
      default:
        return (
          <ConversationList
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Mobile Header */}
      <div className='lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between'>
        <h1 className='text-lg font-semibold text-gray-900'>Let's Chat</h1>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md'
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`${showMobileMenu ? 'block' : 'hidden'} lg:block lg:flex-shrink-0 w-80 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Desktop Header */}
        <div className='hidden lg:flex items-center justify-between p-4 border-b border-gray-200'>
          <h1 className='text-lg font-semibold text-gray-900'>Let's Chat</h1>
          <div className='flex items-center space-x-2'>
            <button
              onClick={handleNewConversation}
              className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
              title='New conversation'
            >
              <Message size={20} />
            </button>
            <button
              className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
              title='Settings'
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden lg:flex border-b border-gray-200 bg-white'>
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Message size={16} className='inline mr-2' />
            Chat
          </button>
          <button
            onClick={() => setCurrentView('connections')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'connections'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} className='inline mr-2' />
            Connections
          </button>
          <button
            onClick={() => setCurrentView('notifications')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'notifications'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell size={16} className='inline mr-2' />
            Notifications
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className='lg:hidden flex border-b border-gray-200 bg-white'>
          <button
            onClick={() => {
              setCurrentView('chat');
              setShowMobileMenu(false);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Message size={16} className='inline mr-2' />
            Chat
          </button>
          <button
            onClick={() => {
              setCurrentView('connections');
              setShowMobileMenu(false);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'connections'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} className='inline mr-2' />
            Connections
          </button>
          <button
            onClick={() => {
              setCurrentView('notifications');
              setShowMobileMenu(false);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentView === 'notifications'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell size={16} className='inline mr-2' />
            Notifications
          </button>
        </div>

        {/* Sidebar Content */}
        <div className='flex-1 overflow-hidden'>{renderSidebar()}</div>

        {/* Mobile Actions */}
        <div className='lg:hidden p-4 border-t border-gray-200 bg-white'>
          <button
            onClick={handleNewConversation}
            className='w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium'
          >
            New Conversation
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col'>
        {selectedConversationId && currentView === 'chat' ? (
          <ChatPage
            conversationId={selectedConversationId}
            conversationName={selectedConversationId}
          />
        ) : currentView === 'chat' ? (
          <div className='flex-1 flex items-center justify-center bg-gray-50'>
            <div className='text-center'>
              <Message className='w-16 h-16 mx-auto mb-4 text-gray-400' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Welcome to Let's Chat
              </h2>
              <p className='text-gray-600 mb-4'>
                Select a conversation to start messaging
              </p>
              <button
                onClick={handleNewConversation}
                className='inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium'
              >
                <Message size={16} className='mr-2' />
                Start a Conversation
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={() => {
          setShowNewConversationModal(false);
          // Optionally refresh conversation list
        }}
      />
    </div>
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
