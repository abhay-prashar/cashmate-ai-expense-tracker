'use client';

import React from 'react';

export default function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4" // Added padding to backdrop
      onClick={onClose} 
    >
      {/* Modal Content Box */}
      <div 
        className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-11/12 sm:max-w-lg"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h3> 
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times; 
          </button>
        </div>
        {/* Modal Body (where TransactionForm goes) */}
   <div className="max-h-[65vh] overflow-y-auto pr-2">
             {children}
        </div>
      </div>
    </div>
  );
}