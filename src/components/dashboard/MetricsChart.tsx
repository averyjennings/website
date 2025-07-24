import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { WebVitalMetric } from '@/types/performance';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricsChartProps {
  metrics: WebVitalMetric[];
  type: 'line' | 'bar' | 'doughnut';
  metricName?: WebVitalMetric['name'] | 'Page Visits';
  title?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  showLegend?: boolean;
  height?: number;
}

const METRIC_COLORS: Record<string, string> = {
  CLS: '#10B981', // green
  FCP: '#3B82F6', // blue  
  LCP: '#F59E0B', // amber
  TTFB: '#8B5CF6', // purple
  INP: '#EF4444', // red
  'Page Visits': '#EC4899', // pink
};

const RATING_COLORS = {
  good: '#10B981',
  'needs-improvement': '#F59E0B', 
  poor: '#EF4444',
};

export function MetricsChart({
  metrics,
  type = 'line',
  metricName,
  title,
  timeRange = '24h',
  showLegend = true,
  height = 300,
}: MetricsChartProps) {
  const filteredData = useMemo(() => {
    let filtered = metricName 
      ? metrics.filter(m => m.name === metricName)
      : metrics;

    // Apply time range filter
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,  
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - timeRanges[timeRange];
    filtered = filtered.filter(m => m.timestamp >= cutoff);

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [metrics, metricName, timeRange]);

  const chartData = useMemo(() => {
    if (type === 'doughnut') {
      // Doughnut chart shows rating distribution
      const ratingCounts = filteredData.reduce(
        (acc, metric) => {
          acc[metric.rating]++;
          return acc;
        },
        { good: 0, 'needs-improvement': 0, poor: 0 }
      );

      return {
        labels: ['Good', 'Needs Improvement', 'Poor'],
        datasets: [
          {
            data: [ratingCounts.good, ratingCounts['needs-improvement'], ratingCounts.poor],
            backgroundColor: [
              RATING_COLORS.good,
              RATING_COLORS['needs-improvement'], 
              RATING_COLORS.poor,
            ],
            borderWidth: 0,
          },
        ],
      };
    }

    if (metricName) {
      // Single metric over time
      const labels = filteredData.map(m => 
        format(new Date(m.timestamp), timeRange === '1h' ? 'HH:mm' : 'MMM dd HH:mm')
      );
      const values = filteredData.map(m => m.value);

      return {
        labels,
        datasets: [
          {
            label: metricName,
            data: values,
            borderColor: METRIC_COLORS[metricName as string],
            backgroundColor: type === 'line' 
              ? `${METRIC_COLORS[metricName as string]}20`
              : METRIC_COLORS[metricName as string],
            fill: type === 'line',
            tension: 0.4,
          },
        ],
      };
    }

    // Multiple metrics
    const metricTypes = [...new Set(filteredData.map(m => m.name))];
    const timeLabels = [...new Set(filteredData.map(m => 
      format(new Date(m.timestamp), timeRange === '1h' ? 'HH:mm' : 'MMM dd HH:mm')
    ))].sort();

    const datasets = metricTypes.map(metric => {
      const metricData = filteredData.filter(m => m.name === metric);
      const dataByTime = timeLabels.map(label => {
        const matchingMetrics = metricData.filter(m => 
          format(new Date(m.timestamp), timeRange === '1h' ? 'HH:mm' : 'MMM dd HH:mm') === label
        );
        return matchingMetrics.length > 0 ? matchingMetrics[0].value : null;
      });

      return {
        label: metric,
        data: dataByTime,
        borderColor: METRIC_COLORS[metric as string],
        backgroundColor: type === 'line' 
          ? `${METRIC_COLORS[metric as string]}20`
          : METRIC_COLORS[metric as string],
        fill: type === 'line',
        tension: 0.4,
      };
    });

    return {
      labels: timeLabels,
      datasets,
    };
  }, [filteredData, metricName, type, timeRange]);

  const options = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const,
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y || context.parsed;
              const metric = metricName || context.dataset.label;
              
              if (type === 'doughnut') {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }

              let unit = '';
              if (metric !== 'CLS' && metric !== 'Page Visits') {
                unit = ' ms';
              } else if (metric === 'Page Visits') {
                unit = ' visits';
              }

              return `${metric}: ${typeof value === 'number' ? value.toFixed(metric === 'CLS' ? 3 : metric === 'Page Visits' ? 0 : 0) : value}${unit}`;
            },
          },
        },
      },
    };

    if (type === 'doughnut') {
      return baseOptions;
    }

    return {
      ...baseOptions,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: metricName === 'CLS' ? 'Score' : 
                  (metricName as string) === 'Page Visits' ? 'Visits' : 
                  'Time (ms)',
          },
          beginAtZero: true,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
    };
  }, [metricName, showLegend, title, type]);

  if (filteredData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">No data available</div>
          <div className="text-sm">
            {metricName 
              ? `No ${metricName} metrics found for the selected time range`
              : 'No metrics found for the selected time range'
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      {type === 'line' && <Line key={`line-${metricName || 'all'}-${timeRange}`} data={chartData} options={options} />}
      {type === 'bar' && <Bar key={`bar-${metricName || 'all'}-${timeRange}`} data={chartData} options={options} />}
      {type === 'doughnut' && <Doughnut key={`doughnut-${timeRange}`} data={chartData} options={options} />}
    </div>
  );
}