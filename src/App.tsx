import Layout from './components/layout/Layout';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import { ThemeProvider } from './components/providers/ThemeProvider';
import SEO from './components/SEO';
import { MetricsTestComponent } from './components/dashboard/MetricsTestComponent';
import { ActivityFeed, ContributionGraph, RepoStats, LanguageChart } from './components/github';
import { HeatmapToggle } from './components/heatmap/HeatmapToggle';

function App() {
  return (
    <ThemeProvider>
      <SEO />
      <Layout>
        <Hero />
        <About />
        <Projects />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ActivityFeed maxItems={8} />
              <RepoStats showTopRepos={true} showLanguages={true} maxRepos={4} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ContributionGraph />
              <LanguageChart chartType="doughnut" maxLanguages={6} />
            </div>
          </div>
        </section>
        <section id="performance" className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <MetricsTestComponent />
          </div>
        </section>
        <Contact />
        {/* Heatmap Analytics System */}
        <HeatmapToggle />
      </Layout>
    </ThemeProvider>
  );
}

export default App