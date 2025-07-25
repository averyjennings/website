import { motion } from 'framer-motion';
import ProjectCard from '../ui/ProjectCard';
import { useState, useMemo, useCallback } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useGitHubRepositories, useGitHubLanguages } from '@/hooks/useGitHubData';
import { GitHubRepo } from '@/services/github-api';
import { useDebounce } from '@/hooks/useDebounce';

// Language to category mapping
const LANGUAGE_TO_CATEGORY: Record<string, string> = {
  'TypeScript': 'frontend',
  'JavaScript': 'frontend',
  'React': 'frontend',
  'Vue': 'frontend',
  'Angular': 'frontend',
  'HTML': 'frontend',
  'CSS': 'frontend',
  'Python': 'backend',
  'Java': 'backend',
  'Go': 'backend',
  'Rust': 'backend',
  'PHP': 'backend',
  'Ruby': 'backend',
  'C#': 'backend',
  'Swift': 'mobile',
  'Kotlin': 'mobile',
  'Dart': 'mobile',
  'Shell': 'tools',
  'PowerShell': 'tools',
  'Dockerfile': 'tools',
  'YAML': 'tools',
};

// Transform GitHub repo to project card format
const transformRepoToProject = (repo: GitHubRepo, languageStats?: Record<string, { bytes: number; percentage: number }>) => {
  const primaryLanguage = repo.language || 'Unknown';
  const languages = repo.topics || [primaryLanguage];
  
  // Get additional languages from language stats
  const additionalLanguages = languageStats ? 
    Object.entries(languageStats)
      .slice(0, 6) // Top 6 languages
      .map(([lang]) => lang)
      .filter(lang => lang !== primaryLanguage) : [];
      
  const allTechnologies = [primaryLanguage, ...additionalLanguages, ...languages]
    .filter((tech, index, arr) => arr.indexOf(tech) === index && tech !== 'Unknown')
    .slice(0, 8); // Limit to 8 technologies
  
  const category = LANGUAGE_TO_CATEGORY[primaryLanguage] || 'other';
  
  // Determine if featured based on stars, forks, and recent activity
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const recentActivity = new Date(repo.updated_at).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000); // Updated within 90 days
  const featured = stars >= 5 || forks >= 2 || recentActivity;
  
  return {
    title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: repo.description || 'A GitHub repository showcasing development skills and coding practices.',
    technologies: allTechnologies,
    github: repo.html_url,
    demo: repo.homepage || repo.html_url,
    image: '',
    category,
    featured,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    language: primaryLanguage,
    updatedAt: repo.updated_at,
  };
};

const Projects = () => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [minStars, setMinStars] = useState(0);
  const [minForks, setMinForks] = useState(0);
  const [activityFilter, setActivityFilter] = useState('all'); // all, recent, year
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.1 });
  
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Fetch GitHub data
  const { data: repositories, isLoading: reposLoading, error: reposError } = useGitHubRepositories('updated');
  const { data: languageStats, isLoading: langLoading } = useGitHubLanguages();
  
  // Transform repositories to projects
  const projects = useMemo(() => {
    if (!repositories) return [];
    return repositories.map(repo => transformRepoToProject(repo, languageStats));
  }, [repositories, languageStats]);
  
  // Get unique categories and languages from actual projects
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(projects.map(p => p.category))];
    return [
      { id: 'all', label: 'All Projects', count: projects.length },
      ...uniqueCategories.map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: projects.filter(p => p.category === cat).length
      }))
    ];
  }, [projects]);
  
  const languages = useMemo(() => {
    const uniqueLanguages = [...new Set(projects.map(p => p.language).filter(Boolean))];
    return [
      { id: 'all', label: 'All Languages', count: projects.length },
      ...uniqueLanguages.map(lang => ({
        id: lang,
        label: lang,
        count: projects.filter(p => p.language === lang).length
      }))
    ];
  }, [projects]);
  
  const activityOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'recent', label: 'Last 3 Months' },
    { id: 'year', label: 'Last Year' },
    { id: 'older', label: 'Older than 1 Year' }
  ];

  // Filter and sort projects with advanced filtering and search
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Apply search filter first (most restrictive)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(project => {
        // Search in title, description, technologies, and language
        const searchableText = [
          project.title.toLowerCase(),
          project.description.toLowerCase(),
          ...project.technologies.map(tech => tech.toLowerCase()),
          project.language?.toLowerCase() || '',
          project.category.toLowerCase()
        ].join(' ');
        
        // Support multi-word search queries
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        return queryWords.every(word => searchableText.includes(word));
      });
    }
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(project => project.category === filter);
    }
    
    // Apply language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(project => project.language === languageFilter);
    }
    
    // Apply stars filter
    if (minStars > 0) {
      filtered = filtered.filter(project => project.stars >= minStars);
    }
    
    // Apply forks filter
    if (minForks > 0) {
      filtered = filtered.filter(project => project.forks >= minForks);
    }
    
    // Apply activity filter
    if (activityFilter !== 'all') {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(project => {
        const updatedDate = new Date(project.updatedAt);
        switch (activityFilter) {
          case 'recent':
            return updatedDate >= threeMonthsAgo;
          case 'year':
            return updatedDate >= oneYearAgo;
          case 'older':
            return updatedDate < oneYearAgo;
          default:
            return true;
        }
      });
    }
    
    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    
    return filtered;
  }, [projects, filter, languageFilter, minStars, minForks, activityFilter, sortBy, debouncedSearchQuery]);
  
  // Reset filters function
  const resetFilters = useCallback(() => {
    setFilter('all');
    setLanguageFilter('all');
    setMinStars(0);
    setMinForks(0);
    setActivityFilter('all');
    setSortBy('updated');
    setSearchQuery('');
  }, []);
  
  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // Check if any filters are active
  const hasActiveFilters = languageFilter !== 'all' || minStars > 0 || minForks > 0 || activityFilter !== 'all';
  const hasActiveSearch = debouncedSearchQuery.trim().length > 0;
  const hasAnyActiveFilters = hasActiveFilters || hasActiveSearch;
  
  const isLoading = reposLoading || langLoading;
  const hasError = reposError;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden" ref={sectionRef}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-100/30 to-transparent dark:from-primary-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            whileInView={{ scale: [0.9, 1.02, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Featured Projects
          </motion.h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            {isLoading ? 'Loading projects from GitHub...' : 
             hasError ? 'Unable to load projects. Showing cached data.' :
             `Here are ${projects.length} projects from my GitHub repositories that showcase my development work`}
          </p>
          
          {/* Controls */}
          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Basic Filter buttons */}
            <motion.div 
              className="flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === category.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.label}
                  <span className="ml-1 text-xs opacity-70">
                    ({category.count})
                  </span>
                </motion.button>
              ))}
            </motion.div>
            
            {/* Search Bar */}
            <motion.div
              className="relative w-full max-w-md"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects by name, description, or technology..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <motion.button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </div>
              {hasActiveSearch && (
                <motion.div
                  className="absolute -bottom-6 left-0 text-xs text-primary-600 dark:text-primary-400"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  Searching for "{debouncedSearchQuery}"
                </motion.div>
              )}
            </motion.div>
            
            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              {/* Sort dropdown */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'stars' | 'name')}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="stars">Most Stars</option>
                  <option value="name">Name</option>
                </select>
              </motion.div>
              
              {/* Advanced Filters Toggle */}
              <motion.button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Advanced Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                    {[languageFilter !== 'all', minStars > 0, minForks > 0, activityFilter !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </motion.button>
              
              {/* Clear All Button */}
              {hasAnyActiveFilters && (
                <motion.button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </motion.button>
              )}
              
              {/* Results count */}
              <motion.div 
                className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
              >
                <span>Showing {filteredProjects.length} of {projects.length} projects</span>
                {(hasActiveSearch || hasActiveFilters) && (
                  <motion.span 
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    Filtered
                  </motion.span>
                )}
              </motion.div>
            </div>
            
            {/* Advanced Filters Panel */}
            <motion.div
              initial={false}
              animate={{
                height: showAdvancedFilters ? 'auto' : 0,
                opacity: showAdvancedFilters ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-4xl overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Language Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {languages.map(lang => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label} ({lang.count})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Minimum Stars */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Stars: {minStars}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={minStars}
                      onChange={(e) => setMinStars(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Minimum Forks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Forks: {minForks}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={minForks}
                      onChange={(e) => setMinForks(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Activity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Activity
                    </label>
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {activityOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Advanced Reset Button */}
                {hasActiveFilters && (
                  <div className="flex justify-center pt-2">
                    <motion.button
                      onClick={resetFilters}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Advanced Filters
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <motion.div
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Loading projects from GitHub...</span>
            </motion.div>
          </div>
        )}
        
        {/* Error State */}
        {hasError && !isLoading && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Unable to load projects from GitHub.</p>
              <p className="text-sm mt-2">Please check your internet connection or try again later.</p>
            </div>
          </motion.div>
        )}
        
        {/* Projects Grid */}
        {!isLoading && !hasError && (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            layout
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  layout: {
                    type: "spring",
                    bounce: 0.4,
                  },
                }}
              >
                <ProjectCard
                  {...project}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* No projects message */}
        {!isLoading && !hasError && filteredProjects.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-gray-600 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">
                {hasActiveSearch ? `No projects found for "${debouncedSearchQuery}"` : 'No projects found'}
              </p>
              <p className="text-sm">
                {hasActiveSearch ? (
                  <span>
                    Try adjusting your search terms or{' '}
                    <button 
                      onClick={clearSearch}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      clear search
                    </button>
                  </span>
                ) : hasActiveFilters ? (
                  <span>
                    Try adjusting your filters or{' '}
                    <button 
                      onClick={resetFilters}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      reset all filters
                    </button>
                  </span>
                ) : (
                  'Try selecting a different category or check back later.'
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* View more on GitHub */}
        {!isLoading && !hasError && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.a
              href={`https://github.com/${import.meta.env.VITE_GITHUB_USERNAME || 'yourusername'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>View all {projects.length}+ projects on GitHub</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Projects;