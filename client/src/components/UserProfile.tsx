import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Edit2, Save, X, Mail, Calendar, Shield } from 'lucide-react';

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      await updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
      });

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: '',
      avatarUrl: user?.avatarUrl || '',
    });
    setIsEditing(false);
    setError('');
  };

  const getJoinDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return 'Unknown';
  };

  const getStatusColor = () => {
    switch (user?.status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!user) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Profile Settings
          </h2>
          <div className='flex items-center space-x-2'>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className='flex items-center space-x-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className='flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  {isLoading ? (
                    <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full' />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className='flex items-center space-x-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className='p-2 text-gray-400 hover:text-gray-600 rounded-full'
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
              {error}
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Avatar Section */}
            <div className='md:col-span-1'>
              <div className='text-center'>
                <div className='relative inline-block'>
                  <div className='w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt={formData.displayName}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      formData.displayName?.[0]?.toUpperCase() ||
                      user.username[0]?.toUpperCase()
                    )}
                  </div>
                  {isEditing && (
                    <button className='absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700'>
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                <div className='mt-4'>
                  <div className='flex items-center justify-center space-x-2'>
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor()}`}
                    ></div>
                    <span className='text-sm font-medium text-gray-900 capitalize'>
                      {user.status}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 mt-1'>@{user.username}</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className='md:col-span-2 space-y-6'>
              {/* Basic Information */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                  <Shield className='mr-2' size={20} />
                  Basic Information
                </h3>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Display Name
                    </label>
                    <input
                      type='text'
                      value={formData.displayName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100'
                      placeholder='Your display name'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Username
                    </label>
                    <input
                      type='text'
                      value={user.username}
                      disabled
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100'
                      placeholder='Username'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      Username cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email
                    </label>
                    <div className='flex items-center space-x-2'>
                      <Mail size={20} className='text-gray-400' />
                      <input
                        type='email'
                        value={formData.email}
                        onChange={e =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100'
                        placeholder='your@email.com'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={e =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 resize-none'
                      placeholder='Tell us about yourself...'
                      maxLength={200}
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      {formData.bio.length}/200 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                  <Calendar className='mr-2' size={20} />
                  Account Information
                </h3>

                <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Member Since</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {getJoinDate()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Account ID</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {user.id}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Status</span>
                    <span className='text-sm font-medium text-gray-900 capitalize'>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
