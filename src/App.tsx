import { useEffect, useRef } from 'react';
import Layout from './components/layout/Layout';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import { ThemeProvider } from './components/providers/ThemeProvider';
import SEO from './components/SEO';
import { SEOProvider } from './components/seo/SEOProvider';
import { StructuredData } from './components/seo/StructuredData';
import { DynamicStructuredData } from './components/seo/DynamicStructuredData';
import { MetricsTestComponent } from './components/dashboard/MetricsTestComponent';
import { ActivityFeed, ContributionGraph, RepoStats, LanguageChart, GitHubStatus } from './components/github';
import { HeatmapToggle } from './components/heatmap/HeatmapToggle';
import { HeatmapErrorBoundary } from './components/heatmap/HeatmapErrorBoundary';
import { supabaseAnalyticsService } from '@/services/supabase-analytics';

function App() {
  // Use ref to prevent double-counting in React StrictMode (development)
  const hasRecordedPageVisit = useRef(false);

  // Record page visit when app loads
  useEffect(() => {
    // Prevent double-counting in React StrictMode
    if (hasRecordedPageVisit.current) {
      console.log('📊 Page visit already recorded (React StrictMode), skipping...');
      return;
    }

    console.log('📊 App loaded, recording page visit...');
    hasRecordedPageVisit.current = true;
    
    supabaseAnalyticsService.recordPageVisit().catch(error => {
      console.error('Failed to record page visit from App:', error);
      // Reset flag on error so it can be retried
      hasRecordedPageVisit.current = false;
    });
  }, []);
  return (
    <SEOProvider>
      <ThemeProvider>
        <SEO />
        <StructuredData type="website" />
        <Layout>
          <Hero />
          <About />
          <Projects />
          <DynamicStructuredData sectionType="projects" />
          <section id="github" className="py-20 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  GitHub Activity
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Explore my coding journey through contributions and repositories
                </p>
              </div>
              {/* GitHub API Status */}
              <GitHubStatus className="mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ActivityFeed maxItems={8} />
                <RepoStats showTopRepos={true} showLanguages={true} maxRepos={4} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ContributionGraph />
                <LanguageChart chartType="doughnut" maxLanguages={6} />
              </div>
            </div>
            <DynamicStructuredData sectionType="github" />
          </section>
          <section id="performance" className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <MetricsTestComponent />
            </div>
            <DynamicStructuredData sectionType="performance" />
          </section>
          <Contact />
        </Layout>
        {/* Heatmap Analytics System - Outside Layout for full-site coverage */}
        <HeatmapErrorBoundary>
          <HeatmapToggle />
        </HeatmapErrorBoundary>
      </ThemeProvider>
    </SEOProvider>
  );
}

export default App