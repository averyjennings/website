import { useEffect } from 'react';

interface Project {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  dateCreated?: string;
  stars?: number;
  language?: string;
}

interface DynamicStructuredDataProps {
  projects?: Project[];
  sectionType?: 'projects' | 'github' | 'performance';
}

export function DynamicStructuredData({ projects = [], sectionType }: DynamicStructuredDataProps) {
  
  useEffect(() => {
    // Remove any existing dynamic structured data
    const existingScript = document.getElementById('dynamic-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Generate dynamic structured data based on props
    let structuredData = {};

    if (sectionType === 'projects' && projects.length > 0) {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Software Development Projects",
        "description": "A collection of software projects by Software Engineer",
        "itemListElement": projects.map((project, index) => ({
          "@type": "SoftwareApplication",
          "position": index + 1,
          "name": project.name,
          "description": project.description,
          "url": project.url,
          "applicationCategory": "WebApplication",
          "operatingSystem": "Web Browser",
          "programmingLanguage": project.technologies,
          "dateCreated": project.dateCreated,
          "aggregateRating": project.stars ? {
            "@type": "AggregateRating",
            "ratingValue": Math.min(5, Math.max(1, (project.stars / 10))),
            "reviewCount": project.stars
          } : undefined,
          "creator": {
            "@type": "Person", 
            "name": "Software Engineer"
          }
        }))
      };
    } else if (sectionType === 'github') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
          "@type": "Person",
          "name": "Software Engineer",
          "sameAs": [
            "https://github.com/softwareengineer"
          ],
          "hasOccupation": {
            "@type": "Occupation",
            "name": "Software Engineer"
          }
        }
      };
    } else if (sectionType === 'performance') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPageElement",
        "name": "Performance Dashboard",
        "description": "Real-time web performance metrics and analytics",
        "about": {
          "@type": "Thing",
          "name": "Web Performance Optimization"
        }
      };
    }

    // Only inject if we have structured data
    if (Object.keys(structuredData).length > 0) {
      const script = document.createElement('script');
      script.id = 'dynamic-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById('dynamic-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [projects, sectionType]);

  // This component doesn't render anything
  return null;
}

// Hook for updating page title and meta description dynamically
export function useSEO(title?: string, description?: string) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Software Engineer - Full-Stack Developer`;
    }

    // Update meta description if provided
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (metaDescription) {
        metaDescription.content = description;
      }
    }
  }, [title, description]);
}

export default DynamicStructuredData;