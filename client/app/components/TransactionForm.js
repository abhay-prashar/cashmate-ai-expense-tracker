'use client';

import { useState, useRef } from 'react'; 
import axios from 'axios';

export default function TransactionForm({ onTransactionAdded, onClose }) {
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(''); 
  const [type, setType] = useState('expense'); 
  const [date, setDate] = useState(getTodayDate());
  const [error, setError] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const fileInputRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  // Handle Receipt Upload 
  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // User cancelled

    setIsScanning(true);
    setReceiptError('');
    setError(''); // Clear main form error
    const token = localStorage.getItem('token');

    // FormData is required for file uploads
    const formData = new FormData();
    formData.append('receiptImage', file);

    try {
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      };

      // Call our new backend endpoint
      const res = await axios.post(`${API_BASE}/api/receipt/process`, formData, config);
      const data = res.data;

      // --- AUTO-FILL THE FORM ---
      if (data.totalAmount) setAmount(data.totalAmount.toString());
      if (data.suggestedCategory) setCategory(data.suggestedCategory);
      if (data.vendorName) setDescription(data.vendorName);
      // The date input expects "YYYY-MM-DD" format, which our backend provides
      if (data.transactionDate) setDate(data.transactionDate);
      
      // If we got an amount and category, it's likely an expense
      if (data.totalAmount || data.suggestedCategory) setType('expense');

    } catch (err) {
      console.error('Error scanning receipt:', err);
      const errMsg = err.response?.data?.msg || "Failed to scan receipt. Please try again.";
      setReceiptError(errMsg); // Use the separate receipt error state
    } finally {
      setIsScanning(false);
      // Clear the file input value so user can upload the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setReceiptError(''); // Clear receipt error on manual submit

    if (!category) {
        setError('Please select a category.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }

    const transactionData = { 
        description: description || category,
        amount: parseFloat(amount), 
        category, 
        type, 
        date 
    };
    const config = { headers: { 'x-auth-token': token } };

    try {
      await axios.post(`${API_BASE}/api/transactions`, transactionData, config);
      
      // Reset form (onTransactionAdded is called from the modal closing now)
      setDescription('');
      setAmount('');
      setCategory('');
      setType('expense');
      setDate(getTodayDate());
      
      onClose(); // Close the modal
      onTransactionAdded(); // Tell dashboard to refetch (or pass data)
      
    } catch (err) {
      console.error('Error adding transaction:', err);
      const errMsg = err.response?.data?.msg || 'Failed to add transaction. Please try again.';
      setError(errMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      
      <div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleReceiptUpload} 
          style={{ display: 'none' }} 
          accept="image/*" // Only accept images
          disabled={isScanning}
        />
        <button
          type="button" // Important: not a submit button
          onClick={() => fileInputRef.current.click()} // Click the hidden input
          disabled={isScanning}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-indigo-600 text-indigo-600 font-medium rounded-md shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.04l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Scan Receipt
            </>
          )}
        </button>
        {receiptError && <p className="text-red-500 text-sm mt-2">{receiptError}</p>}
      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300"></span>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or Enter Manually</span>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">₹</span>
          </div>
          <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" step="0.01" className="block w-full rounded-md border-gray-300 pl-8 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black" />
        </div>
      </div>

      {/* Category (Required Dropdown) */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${category ? 'text-black' : 'text-gray-500'}`}>
          {/* ... (Category <option> list remains the same) ... */}
          <option value="" disabled>Select a category</option>
          <option value="Food & Drinks">🍔 Food & Drinks</option>
          <option value="Transport">🚌 Transport</option>
          <option value="Stationery & Books">📚 Stationery & Books</option>
          <option value="Mobile Recharge & Bills">📱 Mobile Recharge & Bills</option>
          <option value="Entertainment">🎬 Entertainment</option>
          <option value="Shopping (Personal)">🛍️ Shopping (Personal)</option>
          <option value="Fees & Dues">💸 Fees & Dues</option>
          <option value="Health & Medical">🩺 Health & Medical</option>
          <option value="Gifts & Social">🎁 Gifts & Social</option>
          <option value="Miscellaneous">❓ Miscellaneous</option>
          <option value="Pocket Money">💰 Pocket Money</option>
          <option value="Internship/Part-time">💼 Internship/Part-time</option>
          <option value="Scholarship">🎓 Scholarship</option>
          <option value="Other Income">📈 Other Income</option>
        </select>
      </div>
      
      {/* Description (Optional) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this for? (Optional)" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" />
      </div>

      {/* Date and Type Row */}
      <div className="flex flex-col sm:flex-row gap-4"> 
        {/* Date */}
        <div className="flex-1">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" />
        </div>
        {/* Type (Expense/Income) */}
        <div className="flex-1">
           <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-5">
        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
          Cancel
        </button>
        <button type="submit" className="py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-md shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          {type === 'income' ? 'Add Income' : 'Add Expense'} 
        </button>
      </div>
    </form>
  );
}