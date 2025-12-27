import React from 'react';

export default function App() {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Let's Chat</h1>
        <p className='text-gray-600 mb-8'>Application is loading...</p>
        <div className='space-x-4'>
          <a
            href='/login'
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Login
          </a>
          <a
            href='/register'
            className='bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300'
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
