// React 19 supports native metadata handling

interface Project {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  dateCreated?: string;
  stars?: number;
  language?: string;
}

interface StructuredDataProps {
  projects?: Project[];
  type?: 'person' | 'website' | 'portfolio';
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  author?: string;
  keywords?: string[];
  dateCreated?: string;
  dateModified?: string;
}

export function StructuredData({ 
  projects = [], 
  type = 'person',
  title = "Software Engineer - Full-Stack Developer",
  description = "Passionate full-stack developer and software engineer specializing in React, TypeScript, Node.js, Python, and AWS. Explore my portfolio of innovative web applications and modern software solutions.",
  url = "https://portfolio-eosin.vercel.app/",
  image = "https://portfolio-eosin.vercel.app/og-image.jpg",
  author = "Software Engineer",
  keywords = ["React", "TypeScript", "JavaScript", "Node.js", "Python", "AWS", "Full Stack Developer", "Software Engineer", "Web Development"],
  dateCreated = "2025-01-01",
  dateModified = "2025-01-25"
}: StructuredDataProps) {
  
  const getPersonStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Software Engineer",
    "jobTitle": "Full-Stack Developer & Software Engineer",
    "description": description,
    "url": url,
    "image": image,
    "sameAs": [
      "https://github.com/softwareengineer",
      "https://linkedin.com/in/softwareengineer",
      "https://twitter.com/softwareengineer"
    ],
    "knowsAbout": [
      "React",
      "TypeScript", 
      "JavaScript",
      "Node.js",
      "Python",
      "AWS",
      "Docker",
      "Git",
      "CI/CD",
      "Web Development",
      "Software Engineering",
      "Full Stack Development",
      "Frontend Development",
      "Backend Development",
      "Database Design",
      "RESTful APIs",
      "Responsive Design",
      "Performance Optimization"
    ],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Software Engineer",
      "occupationLocation": {
        "@type": "Place",
        "name": "Remote"
      },
      "skills": "React, TypeScript, Node.js, Python, AWS, Web Development",
      "experienceRequirements": "5+ years"
    },
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance"
    },
    "alumniOf": {
      "@type": "EducationalOrganization", 
      "name": "Computer Science"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "email": "contact@softwareengineer.dev"
  });

  const getWebsiteStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": title,
    "description": description,
    "url": url,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Person",
      "name": author
    },
    "inLanguage": "en-US",
    "copyrightYear": "2025",
    "copyrightHolder": {
      "@type": "Person",
      "name": author
    },
    "genre": "Portfolio",
    "keywords": keywords.join(', '),
    "dateCreated": dateCreated,
    "dateModified": dateModified,
    "mainEntity": {
      "@type": "Person",
      "@id": url + "#person"
    }
  });

  const getPortfolioStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": url + "#portfolio",
    "name": title,
    "description": description,
    "creator": {
      "@type": "Person",
      "name": author,
      "@id": url + "#person"
    },
    "dateCreated": dateCreated,
    "dateModified": dateModified,
    "keywords": keywords,
    "genre": "Software Development Portfolio",
    "about": [
      "Software Engineering",
      "Web Development", 
      "Full Stack Development"
    ],
    "workExample": projects.map(project => ({
      "@type": "SoftwareApplication",
      "name": project.name,
      "description": project.description,
      "url": project.url,
      "applicationCategory": "WebApplication",
      "operatingSystem": "Web Browser",
      "programmingLanguage": project.technologies,
      "dateCreated": project.dateCreated,
      "creator": {
        "@type": "Person",
        "name": author
      }
    }))
  });

  const getBreadcrumbStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": url
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "About",
        "item": url + "#about"
      },
      {
        "@type": "ListItem",
        "position": 3, 
        "name": "Projects",
        "item": url + "#projects"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "GitHub",
        "item": url + "#github"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Performance",
        "item": url + "#performance"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "Contact", 
        "item": url + "#contact"
      }
    ]
  });

  const getStructuredData = () => {
    switch (type) {
      case 'person':
        return getPersonStructuredData();
      case 'website':
        return getWebsiteStructuredData();
      case 'portfolio':
        return getPortfolioStructuredData();
      default:
        return getPersonStructuredData();
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData(), null, 2)
      }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(getBreadcrumbStructuredData(), null, 2)
      }} />
    </>
  );
}

export default StructuredData;