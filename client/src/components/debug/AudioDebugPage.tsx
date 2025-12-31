import React, { useState } from 'react';
import {
  startRinging,
  stopRinging,
  playDialingSound,
  stopDialingSound,
  requestNotificationPermission,
  showCallNotification,
  playAcceptSound,
  playRejectSound,
  playEndSound,
} from '../../utils/callSounds';

export function AudioDebugPage() {
  const [isRinging, setIsRinging] = useState(false);
  const [isDialing, setIsDialing] = useState(false);

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    console.log('Notification permission:', granted);
  };

  const handleShowNotification = () => {
    showCallNotification('Test Call', 'This is a test incoming call');
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Audio Debug Page</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Notification Tests */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Notification Tests</h2>
            <div className='space-y-4'>
              <button
                onClick={handleRequestNotifications}
                className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              >
                Request Notification Permission
              </button>
              <button
                onClick={handleShowNotification}
                className='w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
              >
                Show Test Call Notification
              </button>
            </div>
          </div>

          {/* Audio Tests */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Audio Tests</h2>
            <div className='space-y-4'>
              <button
                onClick={() => {
                  if (isRinging) {
                    stopRinging();
                    setIsRinging(false);
                  } else {
                    startRinging();
                    setIsRinging(true);
                  }
                }}
                className={`w-full px-4 py-2 ${isRinging ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
              >
                {isRinging ? 'Stop Ringing' : 'Start Ringing'}
              </button>

              <button
                onClick={() => {
                  if (isDialing) {
                    stopDialingSound();
                    setIsDialing(false);
                  } else {
                    playDialingSound();
                    setIsDialing(true);
                  }
                }}
                className={`w-full px-4 py-2 ${isDialing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded`}
              >
                {isDialing ? 'Stop Dialing' : 'Start Dialing'}
              </button>
            </div>
          </div>

          {/* Sound Effect Tests */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Sound Effects</h2>
            <div className='space-y-4'>
              <button
                onClick={playAcceptSound}
                className='w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
              >
                Play Accept Sound
              </button>
              <button
                onClick={playRejectSound}
                className='w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
              >
                Play Reject Sound
              </button>
              <button
                onClick={playEndSound}
                className='w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
              >
                Play End Sound
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Testing Instructions</h2>
            <ol className='list-decimal list-inside space-y-2 text-sm'>
              <li>Open browser developer tools to see console logs</li>
              <li>Request notification permission first</li>
              <li>Test audio playback - you should hear sounds</li>
              <li>If no audio, check browser console for errors</li>
              <li>Some browsers require user interaction before audio works</li>
              <li>Try clicking around the page first, then test audio</li>
            </ol>
          </div>
        </div>

        {/* Status Display */}
        <div className='mt-8 bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Status</h2>
          <div className='space-y-2'>
            <p>
              <strong>Ring Status:</strong>{' '}
              {isRinging ? '🔔 Ringing' : '⏸️ Stopped'}
            </p>
            <p>
              <strong>Dial Status:</strong>{' '}
              {isDialing ? '📞 Dialing' : '⏸️ Stopped'}
            </p>
            <p>
              <strong>Notification Permission:</strong>{' '}
              {Notification.permission}
            </p>
            <p>
              <strong>Audio Context:</strong>{' '}
              {typeof window.AudioContext !== 'undefined'
                ? '✅ Available'
                : '❌ Not Available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
