import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

const SEO = ({
  title = 'Software Engineer Portfolio',
  description = 'Professional software engineer portfolio showcasing projects, skills, and experience in modern web development.',
  keywords = ['software engineer', 'web developer', 'portfolio', 'React', 'TypeScript', 'full stack'],
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords.join(', ') },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);
      
      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    });

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, keywords, image, url]);

  return null;
};

export default SEO;