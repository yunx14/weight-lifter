'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExerciseData {
  date: string;
  weight: number;
  reps: number;
  sets?: number;
}

interface ExerciseProgressChartProps {
  data: ExerciseData[];
  title?: string;
  chartType?: 'weight' | 'volume' | 'reps';
}

export default function ExerciseProgressChart({
  data,
  title = 'Exercise Progress',
  chartType = 'weight',
}: ExerciseProgressChartProps) {
  const chartData = useMemo(() => {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const labels = sortedData.map(d => d.date);
    let values: number[] = [];
    
    switch(chartType) {
      case 'weight':
        values = sortedData.map(d => d.weight);
        break;
      case 'reps':
        values = sortedData.map(d => d.reps);
        break;
      case 'volume':
        values = sortedData.map(d => d.weight * d.reps * (d.sets || 1));
        break;
      default:
        values = sortedData.map(d => d.weight);
    }
    
    return {
      labels,
      datasets: [
        {
          label: chartType === 'weight' 
            ? 'Weight (kg)' 
            : chartType === 'reps' 
              ? 'Reps' 
              : 'Volume',
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.1,
        },
      ],
    };
  }, [data, chartType]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Line options={options} data={chartData} />
    </div>
  );
} 