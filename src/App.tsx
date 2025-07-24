import Layout from './components/layout/Layout';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import { ThemeProvider } from './components/providers/ThemeProvider';
import SEO from './components/SEO';
import { MetricsTestComponent } from './components/dashboard/MetricsTestComponent';

function App() {
  return (
    <ThemeProvider>
      <SEO />
      <Layout>
        <Hero />
        <About />
        <Projects />
        <section id="performance" className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <MetricsTestComponent />
          </div>
        </section>
        <Contact />
      </Layout>
    </ThemeProvider>
  );
}

export default App