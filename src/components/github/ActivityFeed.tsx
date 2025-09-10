import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useGitHubActivity } from '@/hooks/useGitHubData';
import Loading from '@/components/ui/Loading';
import { GitHubComponentProps, ACTIVITY_CONFIGS, ActivityType } from '@/types/github';

interface ActivityFeedProps extends GitHubComponentProps {
  maxItems?: number;
}

export function ActivityFeed({ 
  className = '', 
  showHeader = true, 
  maxItems = 10,
  variant = 'default' 
}: ActivityFeedProps) {
  const { data: activities, isLoading, isError, error } = useGitHubActivity();

  const processedActivities = useMemo(() => {
    if (!activities) return [];

    return activities.slice(0, maxItems).map(activity => {
      const isCommit = activity.type === 'commit';
      const isEvent = activity.type === 'event';

      if (isCommit) {
        const commit = activity.data;
        return {
          id: activity.id,
          type: 'commit' as const,
          title: commit.commit.message.split('\n')[0],
          description: `Committed to ${activity.repo}`,
          date: activity.date,
          repo: activity.repo,
          url: commit.html_url,
          icon: '💾',
          color: '#28a745',
        };
      }

      if (isEvent) {
        const event = activity.data;
        const config = ACTIVITY_CONFIGS[event.type as ActivityType] || {
          icon: '📋',
          color: '#586069',
          action: 'activity in',
        };

        let title = '';
        let description = '';
        let url = `https://github.com/${event.repo.name}`;

        switch (event.type) {
          case 'PushEvent': {
            const commitCount = event.payload.commits?.length || 1;
            title = `${commitCount} commit${commitCount > 1 ? 's' : ''}`;
            description = `${config.action} ${activity.repo}`;
            break;
          }
          case 'CreateEvent':
            title = `${event.payload.ref_type} ${event.payload.ref || ''}`;
            description = `${config.action} in ${activity.repo}`;
            break;
          case 'DeleteEvent':
            title = `${event.payload.ref_type} ${event.payload.ref}`;
            description = `${config.action} from ${activity.repo}`;
            break;
          case 'PullRequestEvent':
            title = `PR #${event.payload.number}`;
            description = `${event.payload.action} ${config.action} in ${activity.repo}`;
            url = event.payload.pull_request?.html_url || url;
            break;
          case 'IssuesEvent':
            title = `Issue #${event.payload.issue?.number}`;
            description = `${event.payload.action} ${config.action} in ${activity.repo}`;
            url = event.payload.issue?.html_url || url;
            break;
          default:
            title = event.type.replace('Event', '');
            description = `${config.action} ${activity.repo}`;
        }

        return {
          id: activity.id,
          type: 'event' as const,
          title: title || 'GitHub Activity',
          description,
          date: activity.date,
          repo: activity.repo,
          url,
          icon: config.icon,
          color: config.color,
        };
      }

      return null;
    }).filter((activity): activity is NonNullable<typeof activity> => activity !== null);
  }, [activities, maxItems]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
        )}
        <div className="p-6">
          <Loading text="Loading activity..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-lg font-medium mb-2">Failed to load activity</div>
            <div className="text-sm opacity-75">
              {error?.message || 'Unable to fetch GitHub activity data'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!processedActivities || processedActivities.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
        )}
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">No recent activity</div>
          <div className="text-sm">GitHub activity will appear here once available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Latest commits and GitHub events
          </p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {processedActivities.map((activity) => (
          <div 
            key={activity.id} 
            className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation ${
              variant === 'compact' ? 'p-2 sm:p-3' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Activity Icon - Enhanced for mobile */}
              <div 
                className="flex-shrink-0 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: `${activity.color}20` }}
              >
                <span className="text-lg sm:text-base">{activity.icon}</span>
              </div>

              {/* Activity Content - Mobile optimized */}
              <div className="flex-1 min-w-0">
                {/* Mobile: Stack content vertically, Desktop: Side by side */}
                <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm sm:text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 touch-manipulation"
                    >
                      {activity.title}
                    </a>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 sm:line-clamp-none">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Time stamp - Better mobile placement */}
                  {variant !== 'compact' && (
                    <div className="flex-shrink-0 sm:ml-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block sm:inline">
                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Enhanced detailed view for mobile */}
                {variant === 'detailed' && (
                  <div className="mt-2 flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      {activity.repo}
                    </span>
                    <span>
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Link - Mobile enhanced */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <a
          href={`https://github.com/${import.meta.env.VITE_GITHUB_USERNAME || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors touch-manipulation"
        >
          <span>View all activity on GitHub</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}