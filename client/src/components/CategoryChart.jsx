import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// We must register the components we're using with Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryChart({ transactions = [] }) {
  // 'useMemo' re-calculates data only when 'transactions' changes.
  const categoryData = useMemo(() => {
    const categoryMap = {};

    // Filter for expenses and sum them up by category
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        if (!categoryMap[tx.category]) {
          categoryMap[tx.category] = 0;
        }
        categoryMap[tx.category] += tx.amount;
      }
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    return { labels, data };
  }, [transactions]);

  // Data object for the Doughnut chart
  const chartData = {
    labels: categoryData.labels,
    datasets: [
      {
        label: 'Spending',
        data: categoryData.data,
        backgroundColor: [
          '#4A90E2', // Blue
          '#F5A623', // Orange
          '#BD10E0', // Purple
          '#7ED321', // Green
          '#D0021B', // Red
          '#50E3C2', // Teal
          '#9013FE', // Violet
          '#B8E986', // Light Green
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Options for the chart
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          boxWidth: 12,
          font: {
            size: 12,
          },
        },
      },
    },
    cutout: '60%', // Makes it a doughnut chart
  };

  // If there's no data, show a message instead of an empty chart
  if (categoryData.labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No expense data to display yet.</p>
      </div>
    );
  }

  return <Doughnut data={chartData} options={options} />;
}
