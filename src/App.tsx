import Layout from './components/layout/Layout';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import { ThemeProvider } from './components/providers/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </Layout>
    </ThemeProvider>
  );
}

export default App