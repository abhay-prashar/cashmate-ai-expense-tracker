// client/app/register/page.js

'use client'; 

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleChange = (e) => {
    setError(''); // Clear error on change
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError('');

    try {
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/auth/register`, formData);
      router.push('/login'); 

    } catch (err) {
      const errMsg = err.response?.data?.msg || 'Registration failed. Please try again.';
      console.error('Registration failed:', errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Centering container
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        {/* Logo/Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 mb-6">
          Create Your CashMate Account
        </h1>

        {/* Display error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-gray-400"
              placeholder="Your Full Name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-gray-400"
              placeholder="Min. 6 characters"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} transition duration-150 ease-in-out`}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Link to Login Page */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}