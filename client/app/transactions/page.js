
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar'; 
import Link from 'next/link';

export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login'); 
        return;
      }
      const config = { headers: { 'x-auth-token': token } };
      try {
    // Fetch ALL transactions from the backend
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/transactions`, config);
        setTransactions(res.data); // Store all fetched transactions
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions.');
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [router]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  // Delete a transaction
  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this transaction? This action cannot be undone.');
    if (!ok) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setDeletingIds(prev => [...prev, id]);
      const config = { headers: { 'x-auth-token': token } };
      await axios.delete(`${API_BASE}/api/transactions/${id}`, config);
      // Remove from local state
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(err.response?.data?.msg || 'Failed to delete transaction.');
      }
    } finally {
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar /> 

      <main className="max-w-4xl mx-auto p-4 md:p-8"> 
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">All Transactions</h2>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
             &larr; Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Transaction List Container */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex flex-col gap-3">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">You have no transactions yet.</p>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx._id}
                  className="flex justify-between items-center p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-md"
                >
                  <div>
                    <strong className="font-medium text-gray-800 block">{tx.description || tx.category}</strong>
                    <small className="text-sm text-gray-500">
                      {tx.category} &middot; {new Date(tx.date).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold text-lg ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'expense' ? '- ' : '+ '}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                    <button
                      onClick={() => handleDelete(tx._id)}
                      disabled={deletingIds.includes(tx._id)}
                      title="Delete transaction"
                      aria-label="Delete transaction"
                      className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 flex-shrink-0"
                    >
                      {deletingIds.includes(tx._id) ? (
                        <span className="text-sm text-red-600">Deleting...</span>
                      ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}