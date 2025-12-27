import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  const goToFavorites = () => {
    navigate('/friends');
  };

  const goToConversations = () => {
    navigate('/');
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 shadow-sm'>
        <div className='px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <button
              onClick={goToConversations}
              className='flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors'
            >
              <MessageCircle size={24} />
              <span className='text-xl font-semibold'>Let's Chat</span>
            </button>
            {title && <span className='text-gray-400'>/</span>}
            {title && (
              <span className='text-lg font-medium text-gray-700'>{title}</span>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <span className='text-sm text-gray-600 mr-2'>
              Welcome, {user?.username}
            </span>

            <NotificationCenter />

            <button
              onClick={goToFavorites}
              className='p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-full transition-colors'
              title='Friends'
            >
              <Users size={20} />
            </button>

            <button
              onClick={goToProfile}
              className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors'
              title='Profile'
            >
              <User size={20} />
            </button>

            <button
              onClick={goToSettings}
              className='p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors'
              title='Settings'
            >
              <Settings size={20} />
            </button>

            <button
              onClick={handleLogout}
              className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors'
              title='Logout'
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 overflow-hidden'>{children}</main>
    </div>
  );
}
