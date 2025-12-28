import React, { useState, useEffect } from 'react';
import { X, Settings, Bell, Volume2 } from 'lucide-react';

interface NotificationSettingsProps {
  onClose: () => void;
}

interface NotificationSettingsState {
  pushNotifications: boolean;
  soundEnabled: boolean;
  messagePreview: boolean;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        const settings: NotificationSettingsState = JSON.parse(savedSettings);
        setPushNotifications(settings.pushNotifications);
        setSoundEnabled(settings.soundEnabled);
        setMessagePreview(settings.messagePreview);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg w-full max-w-md mx-4'>
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center'>
            <Settings className='h-5 w-5 mr-2' />
            <h2 className='text-lg font-semibold'>Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Bell className='h-4 w-4 mr-3 text-gray-600' />
                <div>
                  <p className='font-medium'>Push Notifications</p>
                  <p className='text-sm text-gray-600'>
                    Browser push notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Volume2 className='h-4 w-4 mr-3 text-gray-600' />
                <div>
                  <p className='font-medium'>Sound Effects</p>
                  <p className='text-sm text-gray-600'>
                    Play sound for new messages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Bell className='h-4 w-4 mr-3 text-gray-600' />
                <div>
                  <p className='font-medium'>Message Preview</p>
                  <p className='text-sm text-gray-600'>
                    Show message content in notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessagePreview(!messagePreview)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  messagePreview ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    messagePreview ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className='flex justify-end p-6 border-t'>
          <button
            onClick={() => {
              // Save settings to localStorage
              const settings = {
                pushNotifications,
                soundEnabled,
                messagePreview,
              };
              localStorage.setItem(
                'notificationSettings',
                JSON.stringify(settings)
              );
              console.log('Notification settings saved:', settings);
              onClose();
            }}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
