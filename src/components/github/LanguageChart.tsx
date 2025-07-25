import { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGitHubLanguages } from '@/hooks/useGitHubData';
import { GitHubComponentProps, LANGUAGE_COLORS } from '@/types/github';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LanguageChartProps extends GitHubComponentProps {
  chartType?: 'doughnut' | 'bar';
  maxLanguages?: number;
  showPercentages?: boolean;
  showBytes?: boolean;
  height?: number;
}

export function LanguageChart({
  className = '',
  showHeader = true,
  chartType = 'doughnut',
  maxLanguages = 8,
  showPercentages = true,
  showBytes = false,
  height = 300,
  variant = 'default',
}: LanguageChartProps) {
  const { data: languages, isLoading, isError, error } = useGitHubLanguages();

  const chartData = useMemo(() => {
    if (!languages || Object.keys(languages).length === 0) {
      return null;
    }

    // Convert to array and sort by bytes
    const languageArray = Object.entries(languages)
      .map(([language, data]) => ({
        language,
        bytes: data.bytes,
        percentage: data.percentage,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, maxLanguages);

    // Prepare data for chart
    const labels = languageArray.map(item => item.language);
    const dataValues = languageArray.map(item => 
      showBytes ? item.bytes : item.percentage
    );
    const backgroundColors = languageArray.map(item => 
      LANGUAGE_COLORS[item.language] || LANGUAGE_COLORS.Default
    );
    const borderColors = backgroundColors.map(color => color);

    return {
      labels,
      datasets: [
        {
          label: showBytes ? 'Bytes' : 'Percentage',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: chartType === 'doughnut' ? 2 : 1,
          hoverBackgroundColor: backgroundColors.map(color => color + 'CC'),
          hoverBorderColor: borderColors,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [languages, maxLanguages, showBytes, chartType]);

  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: variant !== 'compact',
          position: chartType === 'doughnut' ? ('bottom' as const) : ('top' as const),
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed;
              
              if (chartType === 'doughnut' && !showBytes) {
                return `${label}: ${value.toFixed(1)}%`;
              } else if (showBytes) {
                const mb = (value / 1024 / 1024).toFixed(2);
                return `${label}: ${mb} MB`;
              } else {
                return `${label}: ${value.toFixed(1)}%`;
              }
            },
          },
        },
      },
    };

    if (chartType === 'doughnut') {
      return {
        ...baseOptions,
        cutout: '60%',
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            position: 'bottom' as const,
          },
        },
      } as any;
    } else {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: showBytes ? 'Size (MB)' : 'Percentage (%)',
            },
            ticks: {
              callback: function(value: any) {
                if (showBytes) {
                  return (value / 1024 / 1024).toFixed(1) + ' MB';
                } else {
                  return value.toFixed(1) + '%';
                }
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Programming Languages',
            },
          },
        },
      } as any;
    }
  }, [chartType, showBytes, variant]);

  const topLanguages = useMemo(() => {
    if (!languages) return [];
    
    return Object.entries(languages)
      .map(([language, data]) => ({
        language,
        bytes: data.bytes,
        percentage: data.percentage,
        color: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5);
  }, [languages]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        )}
        <div className="p-6">
          <div className="animate-pulse">
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !chartData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Language Distribution
            </h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-lg font-medium mb-2">Failed to load language data</div>
            <div className="text-sm opacity-75">
              {error?.message || 'Unable to fetch GitHub language statistics'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Language Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Programming languages used across repositories
          </p>
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        {/* Chart - Mobile responsive */}
        <div 
          style={{ height: `${height}px` }} 
          className="mb-4 sm:mb-6 relative"
        >
          {chartType === 'doughnut' ? (
            <Doughnut data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Language List - Mobile enhanced */}
        {variant !== 'compact' && topLanguages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Top Languages
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {topLanguages.map((lang, index) => (
                <div key={lang.language} className="flex items-center justify-between p-3 sm:p-2 rounded-lg bg-gray-50 dark:bg-gray-700 touch-manipulation">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-base sm:text-lg font-bold text-gray-400 dark:text-gray-500 w-5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div
                      className="w-4 h-4 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {lang.language}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {showPercentages && (
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {lang.percentage.toFixed(1)}%
                      </div>
                    )}
                    {showBytes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(lang.bytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {variant === 'detailed' && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Object.keys(languages || {}).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Languages
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {topLanguages[0]?.language || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Primary
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {topLanguages[0]?.percentage.toFixed(1) || '0'}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Dominance
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}