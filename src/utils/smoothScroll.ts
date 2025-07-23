export const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const yOffset = -80; // Account for fixed header
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

export const initSmoothScrolling = () => {
  // Handle all anchor links with smooth scrolling
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="#"]');
    
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        const elementId = href.slice(1);
        smoothScrollTo(elementId);
        
        // Update URL without triggering scroll
        window.history.pushState(null, '', href);
      }
    }
  });
};