import { useMemo } from 'react';
import { useGitHubRepoStats, useGitHubRepositories } from '@/hooks/useGitHubData';
import { GitHubComponentProps, LANGUAGE_COLORS } from '@/types/github';
import { formatDistanceToNow } from 'date-fns';

interface RepoStatsProps extends GitHubComponentProps {
  showTopRepos?: boolean;
  showLanguages?: boolean;
  maxRepos?: number;
  maxLanguages?: number;
}

export function RepoStats({
  className = '',
  showHeader = true,
  showTopRepos = true,
  showLanguages = true,
  maxRepos = 5,
  maxLanguages = 6,
  variant = 'default',
}: RepoStatsProps) {
  const { data: stats, isLoading, error } = useGitHubRepoStats();
  const { data: repositories } = useGitHubRepositories();

  const topLanguages = useMemo(() => {
    if (!stats?.languageDistribution) return [];
    
    return Object.entries(stats.languageDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxLanguages)
      .map(([language, count]) => ({
        language,
        count,
        color: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default,
        percentage: ((count / stats.totalRepos) * 100).toFixed(1),
      }));
  }, [stats, maxLanguages]);

  const topRepos = useMemo(() => {
    if (!repositories) return [];
    
    return repositories
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, maxRepos);
  }, [repositories, maxRepos]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
          </div>
        )}
        <div className="p-6 space-y-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Repository Statistics
            </h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-lg font-medium mb-2">Failed to load repository stats</div>
            <div className="text-sm opacity-75">
              {error?.message || 'Unable to fetch GitHub repository data'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Repository Statistics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of GitHub repositories and activity
          </p>
        </div>
      )}
      
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalRepos.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.totalStars.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Stars</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalForks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Forks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(stats.totalSize / 1024).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">MB Total</div>
          </div>
        </div>

        {/* Top Languages */}
        {showLanguages && topLanguages.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Top Languages
            </h4>
            <div className="space-y-2">
              {topLanguages.map((lang) => (
                <div key={lang.language} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {lang.language}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lang.count} repos
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({lang.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Repositories */}
        {showTopRepos && topRepos.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Most Starred Repositories
            </h4>
            <div className="space-y-3">
              {topRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {repo.name}
                        </h5>
                        {repo.language && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      
                      {repo.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {repo.stargazers_count.toLocaleString()}
                        </span>
                        
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7a2 2 0 010-2.828l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {repo.forks_count.toLocaleString()}
                        </span>
                        
                        <span>
                          Updated {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {repo.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                            >
                              {topic}
                            </span>
                          ))}
                          {repo.topics.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{repo.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Most Starred Repository Highlight */}
        {stats.mostStarredRepo && variant === 'detailed' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              🏆 Most Popular Repository
            </h4>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.mostStarredRepo.name}
                  </h5>
                  {stats.mostStarredRepo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {stats.mostStarredRepo.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    ⭐ {stats.mostStarredRepo.stargazers_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">stars</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}