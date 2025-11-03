'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SmartInsights({ className = '' }) {
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in.');
        setIsLoading(false);
        return;
      }

      // Call our new backend endpoint
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/ai/insights`,
        {}, // We send an empty body, the backend gets the user ID from the token
        { headers: { 'x-auth-token': token } }
      );
      
      // Split the bulleted string into an array for nice formatting
      setInsights(res.data.insights.split('•').filter(insight => insight.trim() !== ''));
    
} catch (err) {
      console.error('Error fetching insights:', err);
      // Check if the error response exists and has data
      if (err.response && err.response.data) {
        // Specifically check for the 429 Too Many Requests status
        if (err.response.status === 429) {
          setError(err.response.data.insights); // Use the specific message from backend
        } else {
          // Use message from backend if available, otherwise generic
          setError(err.response.data.insights || err.response.data.msg || 'Could not generate insights. Please try again.'); 
        }
      } else {
        // Fallback for network errors or other issues
        setError('Could not connect to the insights service. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Smart Insights</h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <p className="text-gray-500 animate-pulse">Generating your insights...</p>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : insights.length > 0 ? (
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">💡</span>
              <span className="text-gray-700">{insight.trim()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Click the button to generate AI-powered insights on your spending!</p>
      )}

      <button
        onClick={fetchInsights}
        disabled={isLoading}
        className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Thinking...' : 'Generate My Insights'}
      </button>
    </div>
  );
}