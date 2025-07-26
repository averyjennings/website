import { useState, useEffect } from 'react';
import { heatmapTracker, HeatmapConfig, HeatmapDataPoint } from '@/services/heatmap-tracker';
import { HeatmapOverlay } from './HeatmapOverlay';

interface HeatmapToggleProps {
  className?: string;
}

export function HeatmapToggle({ className = '' }: HeatmapToggleProps) {
  const [config, setConfig] = useState<HeatmapConfig>(heatmapTracker.getConfig());
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  
  // PHASE 6: Enable heatmap by default with intelligent first-time detection
  const [isVisible, setIsVisible] = useState(() => {
    // Check if this is the first time visiting or if user has explicitly set a preference
    const userPreference = localStorage.getItem('heatmap-visibility-preference');
    const hasSeenIntro = localStorage.getItem('heatmap-intro-seen');
    
    if (userPreference !== null) {
      // User has explicitly set a preference
      return userPreference === 'true';
    } else if (!hasSeenIntro) {
      // First time visitor - enable by default
      return true;
    } else {
      // Returning visitor who has seen intro but no explicit preference - respect previous behavior
      return false;
    }
  });
  
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
  
  // PHASE 6: Onboarding state management
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasSeenIntro = localStorage.getItem('heatmap-intro-seen');
    const userPreference = localStorage.getItem('heatmap-visibility-preference');
    // Show onboarding if first time visitor AND heatmap is visible by default
    return !hasSeenIntro && userPreference === null;
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

  // No auto-refresh - only manual refresh to maintain performance and stability
  // Buffer data provides instant feedback, database data provides persistence

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

  // PHASE 6: Enhanced visibility toggle with preference persistence
  const handleToggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    // Save user preference
    localStorage.setItem('heatmap-visibility-preference', newVisibility.toString());
    
    if (newVisibility) {
      loadHeatmapData();
    }
  };

  // PHASE 6: Onboarding handlers
  const handleOnboardingComplete = (keepVisible: boolean) => {
    localStorage.setItem('heatmap-intro-seen', 'true');
    localStorage.setItem('heatmap-visibility-preference', keepVisible.toString());
    setShowOnboarding(false);
    setIsVisible(keepVisible);
    
    if (keepVisible) {
      loadHeatmapData();
    }
  };

  const handleOnboardingDismiss = () => {
    handleOnboardingComplete(false);
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

      {/* PHASE 6: Elegant Heatmap Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full animate-in fade-in duration-300">
            {/* Header with gradient accent */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔥</span>
                  </div>
                  <h3 className="text-xl font-bold">Heatmap Feature</h3>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  See where users interact with your portfolio! Real-time click tracking with beautiful visualizations.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Live Interaction Tracking</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Watch clicks appear in real-time as vibrant heat zones</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Privacy Focused</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Anonymous data collection for insights only</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Optimized Performance</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ultra-fast rendering with 60fps+ performance</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => handleOnboardingComplete(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ✨ Enable Heatmap Experience
                </button>
                <button
                  onClick={handleOnboardingDismiss}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                You can toggle this feature anytime using the control panel
              </p>
            </div>
          </div>
        </div>
      )}

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