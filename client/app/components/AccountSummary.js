'use client';

import React, { useMemo } from 'react';

// Helper function to format currency
const formatCurrency = (amount) => {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function AccountSummary({ transactions = [], className = '' }) {

  const { totalIncome, totalExpenses, netBalance, expensePercentage } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expenses += tx.amount;
    });
    const balance = income - expenses;
    // Cap percentage display for visual sanity
    const percentage = income > 0 ? Math.min((expenses / income) * 100, 1000) : (expenses > 0 ? 1000 : 0); 

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: balance,
      expensePercentage: percentage,
    };
  }, [transactions]);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md flex flex-col ${className}`}> 
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-center sm:text-left col-span-1 sm:col-span-1">
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-semibold ${netBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4"> 
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Expenses</span>
          <span>
             {expensePercentage > 100 ? `>100%` : `${expensePercentage.toFixed(0)}%`} of Income
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-2.5 w-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${expensePercentage > 100 ? 'bg-red-600' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(expensePercentage, 100)}%` }}
          ></div>
        </div>
        {expensePercentage > 100 && (
            <p className="text-xs text-red-600 mt-1 text-right font-medium">
              Warning: Expenses exceed income!
            </p>
        )}
      </div>
    </div>
  );
}