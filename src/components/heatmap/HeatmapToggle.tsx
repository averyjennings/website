import { useState, useEffect } from 'react';
import { heatmapTracker, HeatmapConfig, HeatmapDataPoint } from '@/services/heatmap-tracker';
import { HeatmapOverlay } from './HeatmapOverlay';

interface HeatmapToggleProps {
  className?: string;
}

export function HeatmapToggle({ className = '' }: HeatmapToggleProps) {
  const [config, setConfig] = useState<HeatmapConfig>(heatmapTracker.getConfig());
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<HeatmapDataPoint['eventType'][]>(['click']);
  const [intensity, setIntensity] = useState(70);
  const [radius, setRadius] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isControlsExpanded, setIsControlsExpanded] = useState(() => {
    // Load preference from localStorage, default to collapsed
    const stored = localStorage.getItem('heatmap-controls-expanded');
    return stored === 'true';
  });

  // Initialize heatmap tracker
  useEffect(() => {
    // Start with click tracking enabled by default
    const initialConfig = {
      enabled: true,
      trackClicks: true,
      trackScrolls: false,
      trackHovers: false,
      throttleMs: 100,
      maxDataPoints: 1000,
    };
    
    heatmapTracker.updateConfig(initialConfig);
    setConfig(initialConfig);
  }, []);

  // Load heatmap data when visibility changes
  useEffect(() => {
    if (isVisible) {
      loadHeatmapData();
    }
  }, [isVisible]);

  // Minimal auto-refresh to prevent dots from disappearing
  useEffect(() => {
    if (!isVisible) return;

    // Only refresh every 60 seconds to maintain stability
    const refreshInterval = setInterval(() => {
      console.log(`🔄 Minimal periodic refresh (60s interval)`);
      loadHeatmapData();
    }, 60000); // Every 60 seconds instead of 10

    return () => clearInterval(refreshInterval);
  }, [isVisible]);

  // Manual refresh only - no automatic buffer checking to prevent dots disappearing
  // Users can manually refresh if they want to see new data from other users

  const loadHeatmapData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const currentUrl = window.location.pathname + window.location.hash;
      const data = await heatmapTracker.getHeatmapData(currentUrl, selectedEventTypes);
      
      if (!data || data.length === 0) {
        console.log('📊 No heatmap data found for current page and selected event types');
      } else {
        console.log(`📊 Loaded ${data.length} heatmap data points`);
      }
      
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading heatmap data';
      setLoadError(errorMessage);
      
      // If error might be due to missing database columns, suggest migration
      if (errorMessage.includes('column') || errorMessage.includes('relation')) {
        setLoadError('Database migration required. Please run the heatmap schema update.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTracking = () => {
    const newEnabled = !config.enabled;
    const newConfig = { ...config, enabled: newEnabled };
    
    heatmapTracker.updateConfig(newConfig);
    setConfig(newConfig);
  };

  const handleEventTypeToggle = (eventType: HeatmapDataPoint['eventType']) => {
    const configKey = `track${eventType.charAt(0).toUpperCase() + eventType.slice(1)}s` as keyof HeatmapConfig;
    const currentValue = config[configKey] as boolean;
    const newConfig = { ...config, [configKey]: !currentValue };
    
    heatmapTracker.updateConfig(newConfig);
    setConfig(newConfig);

    // Update selected event types for visualization
    setSelectedEventTypes(prev => {
      if (prev.includes(eventType)) {
        return prev.filter(t => t !== eventType);
      } else {
        return [...prev, eventType];
      }
    });
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      loadHeatmapData();
    }
  };

  const handleClearData = async () => {
    if (confirm('This will clear all heatmap data. Are you sure?')) {
      try {
        setIsLoading(true);
        await heatmapTracker.clearHeatmapData();
        setHeatmapData([]);
        console.log('✅ Heatmap data cleared successfully');
      } catch (error) {
        console.error('Failed to clear heatmap data:', error);
        alert('Failed to clear heatmap data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleControls = () => {
    const newExpanded = !isControlsExpanded;
    setIsControlsExpanded(newExpanded);
    localStorage.setItem('heatmap-controls-expanded', newExpanded.toString());
  };

  const bufferSize = heatmapTracker.getBufferSize();
  const isTracking = heatmapTracker.isCurrentlyTracking();

  return (
    <>
      {/* Heatmap Overlay */}
      <HeatmapOverlay
        data={heatmapData}
        visible={isVisible}
        eventTypes={selectedEventTypes}
        intensity={intensity}
        radius={radius}
      />

      {/* Heatmap Control Panel - Collapsible */}
      <div className={`fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 ${className}`}>
        {!isControlsExpanded ? (
          /* Collapsed State - Compact Toggle Button */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
            <button
              onClick={handleToggleControls}
              className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="font-medium">Heatmap</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        ) : (
          /* Expanded State - Full Control Panel */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 w-[280px] sm:min-w-[300px] max-w-[calc(100vw-16px)] sm:max-w-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                <span className="hidden sm:inline">Heatmap </span>Controls
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {isTracking ? 'Recording' : 'Paused'}
                </span>
                <button
                  onClick={handleToggleControls}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
                  title="Collapse controls"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>

          {/* Main Controls */}
          <div className="space-y-2 sm:space-y-3">
            {/* Toggle Tracking */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Track Interactions
              </label>
              <button
                onClick={handleToggleTracking}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors touch-manipulation ${
                  config.enabled 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`${
                    config.enabled ? 'translate-x-5' : 'translate-x-1'
                  } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Toggle Visualization */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Show Heatmap
                {loadError ? (
                  <span className="ml-1 text-xs text-red-500" title={loadError}>
                    (error)
                  </span>
                ) : heatmapData.length > 0 ? (
                  <span className="ml-1 text-xs text-gray-500">
                    ({heatmapData.length} points)
                  </span>
                ) : isLoading ? (
                  <span className="ml-1 text-xs text-gray-500">
                    (loading...)
                  </span>
                ) : null}
              </label>
              <button
                onClick={handleToggleVisibility}
                disabled={isLoading}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isVisible 
                    ? 'bg-green-600' 
                    : 'bg-gray-200 dark:bg-gray-600'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                <span
                  className={`${
                    isVisible ? 'translate-x-5' : 'translate-x-1'
                  } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Event Type Controls */}
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                Track Events
              </label>
              <div className="space-y-2">
                {(['click', 'scroll', 'hover'] as const).map(eventType => {
                  const configKey = `track${eventType.charAt(0).toUpperCase() + eventType.slice(1)}s` as keyof HeatmapConfig;
                  const isEnabled = config[configKey] as boolean;
                  
                  return (
                    <div key={eventType} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {eventType}
                      </span>
                      <button
                        onClick={() => handleEventTypeToggle(eventType)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                          isEnabled 
                            ? 'bg-blue-500' 
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`${
                            isEnabled ? 'translate-x-4' : 'translate-x-1'
                          } inline-block h-2 w-2 transform rounded-full bg-white transition-transform`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visualization Controls */}
            {isVisible && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                      Intensity: {intensity}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                      Radius: {radius}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status and Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>Buffer: {bufferSize} events</span>
                <button
                  onClick={loadHeatmapData}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {loadError && (
                <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  <div className="font-medium">Error loading heatmap:</div>
                  <div className="mt-1">{loadError}</div>
                  {loadError.includes('migration') && (
                    <div className="mt-1 text-red-600 dark:text-red-400">
                      See MIGRATION-REQUIRED.md for instructions.
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleClearData}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
              >
                Clear All Data
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </>
  );
}

export default HeatmapToggle;