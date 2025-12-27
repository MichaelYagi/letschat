import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  X,
  Check,
  Users,
  MessageCircle,
  AtSign,
  Settings,
} from 'lucide-react';
import { notificationsApi } from '../../services/api';
import {
  Notification,
  NotificationCount,
  NotificationData,
} from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    socket,
    notifications: wsNotifications,
    notificationCounts: wsCounts,
    markNotificationRead,
    markAllNotificationsRead,
  } = useWebSocket();

  // Load initial notifications
  useEffect(() => {
    if (user && !socket) {
      loadNotifications();
    }
  }, [user, socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications({ limit: 20 });
      // Notifications from WebSocket will handle this when connected
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (
    notificationId: string,
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      // Use WebSocket for real-time update if available
      if (socket) {
        markNotificationRead(notificationId);
      } else {
        await notificationsApi.markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Use WebSocket for real-time update if available
      if (socket) {
        markAllNotificationsRead();
      } else {
        await notificationsApi.markAllAsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      await notificationsApi.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <Users className='text-blue-500' size={20} />;
      case 'message':
        return <MessageCircle className='text-green-500' size={20} />;
      case 'mention':
        return <AtSign className='text-purple-500' size={20} />;
      case 'system':
        return <Settings className='text-gray-500' size={20} />;
      default:
        return <Bell className='text-gray-500' size={20} />;
    }
  };

  const handleConnectionRequestAction = async (
    notificationId: string,
    action: 'accept' | 'decline'
  ) => {
    try {
      const notification = wsNotifications.find(n => n.id === notificationId);
      if (notification?.data) {
        const data: NotificationData = JSON.parse(notification.data);
        if (action === 'accept') {
          await notificationsApi.acceptRequest(data.connectionId!);
        } else {
          await notificationsApi.rejectRequest(data.connectionId!);
        }
        await handleMarkAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error handling connection request:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = wsCounts.total;
  const notifications = wsNotifications;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors'
        title='Notifications'
      >
        {unreadCount > 0 ? (
          <BellRing className='animate-pulse' size={20} />
        ) : (
          <Bell size={20} />
        )}

        {unreadCount > 0 && (
          <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden z-50'>
          {/* Header */}
          <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
            <h3 className='font-semibold text-gray-800'>Notifications</h3>
            <div className='flex items-center space-x-2'>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-blue-600 hover:text-blue-800 transition-colors'
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className='p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors'
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className='overflow-y-auto max-h-80'>
            {notifications.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                <Bell size={40} className='mx-auto mb-2 text-gray-300' />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => {
                const data: NotificationData = notification.data
                  ? JSON.parse(notification.data)
                  : {};
                const isUnread = !notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      isUnread ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className='flex items-start space-x-3'>
                      {/* Icon */}
                      <div className='flex-shrink-0 mt-1'>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <p
                              className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
                            >
                              {notification.title}
                            </p>
                            <p
                              className={`text-sm ${isUnread ? 'text-gray-800' : 'text-gray-600'} mt-1`}
                            >
                              {notification.message}
                            </p>

                            {/* Connection Request Actions */}
                            {notification.type === 'connection_request' &&
                              isUnread &&
                              data.connectionId && (
                                <div className='flex items-center space-x-2 mt-2'>
                                  <button
                                    onClick={e =>
                                      handleConnectionRequestAction(
                                        notification.id,
                                        'accept'
                                      )
                                    }
                                    className='px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors flex items-center space-x-1'
                                  >
                                    <Check size={12} />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={e =>
                                      handleConnectionRequestAction(
                                        notification.id,
                                        'decline'
                                      )
                                    }
                                    className='px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors flex items-center space-x-1'
                                  >
                                    <X size={12} />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              )}
                          </div>

                          {/* Actions */}
                          <div className='flex items-center space-x-1 ml-2'>
                            {isUnread && (
                              <button
                                onClick={e =>
                                  handleMarkAsRead(notification.id, e)
                                }
                                className='p-1 text-blue-600 hover:text-blue-800 rounded transition-colors'
                                title='Mark as read'
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={e =>
                                handleDeleteNotification(notification.id, e)
                              }
                              className='p-1 text-gray-400 hover:text-red-600 rounded transition-colors'
                              title='Delete notification'
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Time */}
                        <p className='text-xs text-gray-500 mt-2'>
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
