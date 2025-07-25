import { useWebVitals } from '@/hooks/useWebVitals';
import { MetricsChart } from './MetricsChart';
import { METRIC_INFO } from '@/services/analytics';
import { supabaseAnalyticsService as analyticsService } from '@/services/supabase-analytics';
import { useState, useMemo, useEffect } from 'react';
import { SupabaseTest } from '@/components/SupabaseTest';

export function MetricsTestComponent() {
  const { metrics, loading, error, getStats, refreshData, exportData } = useWebVitals();
  const [chartType, setChartType] = useState<'line' | 'bar' | 'doughnut'>('line');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Get stats based on selected timeRange
  const [stats, setStats] = useState(() => getStats(timeRange));
  const [statsLoading, setStatsLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      
      // Get initial cached stats
      const cachedStats = getStats(timeRange);
      setStats(cachedStats);
      
      // Fetch fresh stats from Supabase
      try {
        const freshStats = await analyticsService.getVisitorStats(timeRange);
        setStats(freshStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
    refreshData();
  }, [timeRange, getStats, refreshData]);

  // Get performance insights
  const performanceGrade = useMemo(() => {
    return analyticsService.getPerformanceGrade();
  }, [metrics]);

  const metricStats = useMemo(() => {
    const metricNames = ['CLS', 'FCP', 'LCP', 'TTFB', 'INP'] as const;
    return metricNames.reduce((acc, name) => {
      acc[name] = analyticsService.getMetricStats(name, timeRange);
      return acc;
    }, {} as Record<string, any>);
  }, [metrics, timeRange]);

  // Get visitor data for charting if needed
  const visitorData = useMemo(() => {
    if (selectedMetric === 'page-visits') {
      return analyticsService.getPageVisitsOverTimeSync(timeRange);
    } else if (selectedMetric === 'unique-visitors') {
      return analyticsService.getUniqueVisitorsOverTimeSync(timeRange);
    }
    return [];
  }, [selectedMetric, timeRange]);

  // Combined metrics data for chart
  const chartMetrics = useMemo(() => {
    if (selectedMetric === 'page-visits') {
      // Convert page visit data to metric-like format
      return visitorData.map(pv => ({
        id: `pv-${pv.timestamp}`,
        name: 'Page Visits' as any,
        value: pv.value,
        rating: 'good' as const,
        delta: 0,
        timestamp: pv.timestamp,
        url: window.location.href,
        navigationType: 'navigate' as const,
      }));
    } else if (selectedMetric === 'unique-visitors') {
      // Convert unique visitor data to metric-like format
      return visitorData.map(uv => ({
        id: `uv-${uv.timestamp}`,
        name: 'Unique Visitors' as any,
        value: uv.value,
        rating: 'good' as const,
        delta: 0,
        timestamp: uv.timestamp,
        url: window.location.href,
        navigationType: 'navigate' as const,
      }));
    } else if (selectedMetric === 'all') {
      // Get all metrics including page visits
      return analyticsService.getAllMetricsWithVisitorDataSync(timeRange);
    }
    return metrics;
  }, [selectedMetric, visitorData, metrics, timeRange]);

  if (loading) {
    return <div className="p-4 text-gray-600">Loading Web Vitals data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  const handleExportJSON = () => {
    const data = exportData('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = exportData('csv');
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Web Vitals Test Dashboard</h2>
        
        {/* Global Time Range Selector */}
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium min-w-0 flex-1 sm:flex-initial"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Visitors</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.uniqueVisitors}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Page Visits</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPageVisits}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={refreshData}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
        >
          Refresh Data
        </button>
        <button
          onClick={handleExportJSON}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
        >
          Export JSON
        </button>
        <button
          onClick={handleExportCSV}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 active:bg-purple-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
        >
          Export CSV
        </button>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Performance Overview
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Overall Grade:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                performanceGrade.overall === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                performanceGrade.overall === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                performanceGrade.overall === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                performanceGrade.overall === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                Grade {performanceGrade.overall}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Core Web Vitals Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {Object.entries(METRIC_INFO).map(([key, info]) => {
              const metricName = key as keyof typeof METRIC_INFO;
              const stats = metricStats[metricName];
              const score = performanceGrade.scores[metricName];
              
              return (
                <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {info.name}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                      score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                      'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {score}/100
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {info.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Latest:</span>
                      <span className="ml-1 font-medium">
                        {stats.latest}
                        {info.unit === 'milliseconds' && stats.latest > 0 ? 'ms' : 
                         info.unit === 'score' && stats.latest > 0 ? '' : 
                         stats.latest > 0 ? info.unit : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Average:</span>
                      <span className="ml-1 font-medium">
                        {stats.average}
                        {info.unit === 'milliseconds' && stats.average > 0 ? 'ms' : 
                         info.unit === 'score' && stats.average > 0 ? '' : 
                         stats.average > 0 ? info.unit : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Good Range:</span>
                      <span className="ml-1 font-medium text-green-600">{info.goodRange}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Trend:</span>
                      <span className={`ml-1 font-medium ${
                        stats.trend === 'improving' ? 'text-green-600' :
                        stats.trend === 'degrading' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {stats.trend === 'improving' ? '↗ Better' : 
                         stats.trend === 'degrading' ? '↘ Worse' : 
                         '→ Stable'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {performanceGrade.recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Performance Recommendations
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {performanceGrade.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center sm:text-left">
              Performance Visualization
            </h3>
            
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
              {/* Chart Type */}
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="doughnut">Rating Distribution</option>
              </select>

              {/* Metric Filter */}
              {chartType !== 'doughnut' && (
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                >
                  <option value="all">All Metrics</option>
                  <option value="page-visits">Page Visits</option>
                  <option value="unique-visitors">Unique Visitors</option>
                  {Object.entries(METRIC_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {key} - {info.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <MetricsChart
            metrics={chartMetrics}
            type={chartType}
            metricName={selectedMetric === 'all' || selectedMetric === 'page-visits' || selectedMetric === 'unique-visitors' ? undefined : selectedMetric as any}
            timeRange={timeRange}
            height={400}
            title={chartType === 'doughnut' 
              ? 'Performance Rating Distribution' 
              : selectedMetric === 'all' 
                ? 'All Metrics Over Time'
                : selectedMetric === 'page-visits'
                  ? 'Page Visits Over Time'
                  : selectedMetric === 'unique-visitors'
                    ? 'Unique Visitors Over Time'
                    : `${selectedMetric} Over Time`
            }
          />
        </div>
      </div>

      {/* Metrics Table/Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center sm:text-left">
            Collected Metrics ({metrics.length})
          </h3>
        </div>
        
        {metrics.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No metrics collected yet. Navigate around the site to generate Web Vitals data.
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block sm:hidden">
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {metrics.slice(-20).reverse().map((metric) => (
                  <div key={metric.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {metric.name}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        metric.rating === 'good' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : metric.rating === 'needs-improvement'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {metric.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        Value: <span className="font-medium text-gray-900 dark:text-white">
                          {metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)}
                          {metric.name !== 'CLS' && ' ms'}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {metric.url.replace(window.location.origin, '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      URL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.slice(-20).reverse().map((metric) => (
                    <tr key={metric.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {metric.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)}
                        {metric.name !== 'CLS' && ' ms'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          metric.rating === 'good' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : metric.rating === 'needs-improvement'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {metric.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {metric.url.replace(window.location.origin, '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Understanding Web Vitals */}
      <div className="mt-6 p-4 sm:p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-4 text-center sm:text-left">
          📊 Understanding Your Web Vitals Data
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Real Metrics Collection:</h5>
            <ul className="space-y-1">
              <li>• Data is collected automatically as you use the site</li>
              <li>• Metrics reflect actual user experience performance</li>
              <li>• Values update in real-time during interactions</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Performance Benchmarks:</h5>
            <ul className="space-y-1">
              <li>• <span className="text-green-600">Good</span>: Meets Google's recommended thresholds</li>
              <li>• <span className="text-yellow-600">Needs Improvement</span>: Close to optimal performance</li>
              <li>• <span className="text-red-600">Poor</span>: Below recommended performance levels</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Data Storage:</h5>
            <ul className="space-y-1">
              <li>• Metrics persist in Supabase for cross-device access</li>
              <li>• Historical data enables trend analysis</li>
              <li>• Export options available for further analysis</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Development Tips:</h5>
            <ul className="space-y-1">
              <li>• Check browser Console for detailed logging</li>
              <li>• Navigate around to generate more data points</li>
              <li>• Use different time ranges to spot trends</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Supabase Test Component */}
      <div className="mt-6">
        <SupabaseTest />
      </div>
    </div>
  );
}