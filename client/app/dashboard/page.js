'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import TransactionForm from '../components/TransactionForm';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import AccountSummary from '../components/AccountSummary';
import SmartInsights from '../components/SmartInsights';
import CategoryChart from '../components/CategoryChart';
import Link from 'next/link';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`${API_BASE}/api/transactions`, config);
      setTransactions(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions.');
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  };

  // --- FETCH ON INITIAL PAGE LOAD ---
  useEffect(() => {
    setLoading(true);
    fetchTransactions().finally(() => {
      setLoading(false);
    });
  }, [router]);


  // --- REFETCH AFTER ADDING TRANSACTION ---
  const handleTransactionAdded = () => {
    fetchTransactions(); // Just refetch the entire list
  };

  // --- REFETCH AFTER DELETING TRANSACTION ---
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
      fetchTransactions(); 
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.response?.data?.msg || 'Failed to delete transaction.');
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
             <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AccountSummary 
              transactions={transactions} 
              className=""
            />
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Expenses</h3>
              <div className="flex flex-col gap-1 flex-grow overflow-hidden">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 my-auto text-center">You have no transactions yet. Click the + button!</p>
                ) : (
                  <div className="overflow-y-auto pr-2">
                    {transactions.slice(0, 3).map(tx => ( 
                      <div
                        key={tx._id}
                        className="flex justify-between items-center py-3 px-2 hover:bg-gray-50 rounded-md border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-grow mr-2 overflow-hidden">
                          <strong className="font-medium text-gray-800 block truncate text-base">{tx.description || tx.category}</strong> 
                          <small className="text-sm text-gray-500">
                            {tx.category} &middot; {new Date(tx.date).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="flex items-center flex-shrink-0 gap-3">
                          <div className={`font-semibold text-base mr-1 whitespace-nowrap ${
                            tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {tx.type === 'expense' ? '- ₹' : '+ ₹'}{tx.amount.toFixed(2)}
                          </div>
                          <button
                            onClick={() => handleDelete(tx._id)}
                            disabled={deletingIds.includes(tx._id)}
                            title="Delete transaction"
                            aria-label="Delete transaction"
                            className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-300 focus:ring-offset-1 flex-shrink-0"
                          >
                            {deletingIds.includes(tx._id) ? (
                              <span className="text-xs px-1">...</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"> 
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {transactions.length > 3 && (
                  <div className="text-center mt-auto pt-3">
                    <Link href="/transactions" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                      View all transactions &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <SmartInsights className="" />
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Categories</h3>
              <div className="w-full h-56 md:h-64 flex-grow flex justify-center items-center min-h-[200px]">
                <CategoryChart transactions={transactions} />
              </div>
            </div>
          </div>

        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold z-40 transition-transform duration-200 ease-in-out hover:scale-110"
          style={{width: '60px', height: '60px'}}
        >
          +
        </button>

        {/* Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Add New Transaction"
        >
          <TransactionForm 
            onTransactionAdded={handleTransactionAdded}
            onClose={() => setIsModalOpen(false)} 
          />
        </Modal>

      </main>
    </div>
  );
}

