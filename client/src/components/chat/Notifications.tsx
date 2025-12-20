import React, { useState, useEffect } from 'react';
import { notificationsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, X, MessageSquare, UserPlus, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'connection_request' | 'mention' | 'system';
  title: string;
  content: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}

export function Notifications() {
  const { user } = useAuth();
  const [notificationsData, setNotificationsData] =
    useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.get();
      setNotificationsData(response);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className='text-blue-600' />;
      case 'connection_request':
        return <UserPlus size={16} className='text-green-600' />;
      case 'mention':
        return <Info size={16} className='text-purple-600' />;
      default:
        return <Bell size={16} className='text-gray-600' />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='p-4'>
        <div className='text-center text-gray-500'>
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200 bg-white'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
            <Bell className='mr-2' size={20} />
            Notifications
            {notificationsData?.unreadCount > 0 && (
              <span className='ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full'>
                {notificationsData.unreadCount}
              </span>
            )}
          </h2>
          {notificationsData?.unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='text-sm text-primary-600 hover:text-primary-700 font-medium'
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className='flex-1 overflow-y-auto'>
        {notificationsData?.notifications.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <Bell className='w-16 h-16 mx-auto mb-4 text-gray-300' />
            <p>No notifications</p>
            <p className='text-sm'>You're all caught up!</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {notificationsData.notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                <div className='flex items-start space-x-3'>
                  {/* Icon */}
                  <div className='flex-shrink-0 mt-1'>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <h3 className='font-medium text-gray-900 text-sm'>
                        {notification.title}
                      </h3>
                      <div className='flex items-center space-x-2 flex-shrink-0'>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className='text-blue-600 hover:text-blue-700 p-1'
                            title='Mark as read'
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className='text-gray-400 hover:text-gray-600 p-1'
                          title='Delete notification'
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <p className='text-sm text-gray-600 mt-1'>
                      {notification.content}
                    </p>
                    <p className='text-xs text-gray-400 mt-2'>
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
