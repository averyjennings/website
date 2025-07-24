import { useQuery, useQueries } from '@tanstack/react-query';
import { 
  githubApi, 
  githubQueryKeys, 
  GitHubUser, 
  GitHubRepo, 
  GitHubEvent, 
  GitHubLanguageStats 
} from '@/services/github-api';

// Cache durations (in milliseconds)
const CACHE_TIMES = {
  USER: 1000 * 60 * 30, // 30 minutes
  REPOSITORIES: 1000 * 60 * 15, // 15 minutes
  EVENTS: 1000 * 60 * 5, // 5 minutes
  COMMITS: 1000 * 60 * 10, // 10 minutes
  CONTRIBUTIONS: 1000 * 60 * 60, // 1 hour
  LANGUAGES: 1000 * 60 * 60, // 1 hour
};

// Hook for user profile data
export function useGitHubUser() {
  return useQuery({
    queryKey: githubQueryKeys.user,
    queryFn: () => githubApi.getUser(),
    staleTime: CACHE_TIMES.USER,
    gcTime: CACHE_TIMES.USER * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for repositories data
export function useGitHubRepositories(sort: 'updated' | 'created' | 'pushed' = 'updated') {
  return useQuery({
    queryKey: [...githubQueryKeys.repositories, sort],
    queryFn: () => githubApi.getRepositories(sort),
    staleTime: CACHE_TIMES.REPOSITORIES,
    gcTime: CACHE_TIMES.REPOSITORIES * 2,
    retry: 2,
    select: (data) => {
      // Filter out forked repositories and sort by various metrics
      return data
        .filter(repo => !repo.full_name.includes('/'))
        .sort((a, b) => {
          if (sort === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          if (sort === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (sort === 'pushed') return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
          return 0;
        });
    },
  });
}

// Hook for a specific repository
export function useGitHubRepository(repoName: string) {
  return useQuery({
    queryKey: githubQueryKeys.repository(repoName),
    queryFn: () => githubApi.getRepository(repoName),
    enabled: !!repoName,
    staleTime: CACHE_TIMES.REPOSITORIES,
    gcTime: CACHE_TIMES.REPOSITORIES * 2,
  });
}

// Hook for user events/activity
export function useGitHubEvents() {
  return useQuery({
    queryKey: githubQueryKeys.events,
    queryFn: () => githubApi.getUserEvents(),
    staleTime: CACHE_TIMES.EVENTS,
    gcTime: CACHE_TIMES.EVENTS * 2,
    retry: 2,
    select: (data) => {
      // Filter to relevant event types and limit to recent events
      const relevantTypes = ['PushEvent', 'CreateEvent', 'DeleteEvent', 'PullRequestEvent', 'IssuesEvent'];
      return data
        .filter(event => relevantTypes.includes(event.type))
        .slice(0, 20); // Limit to 20 most recent events
    },
  });
}

// Hook for user commits
export function useGitHubCommits(repoName?: string) {
  return useQuery({
    queryKey: githubQueryKeys.commits(repoName),
    queryFn: () => githubApi.getUserCommits(repoName),
    staleTime: CACHE_TIMES.COMMITS,
    gcTime: CACHE_TIMES.COMMITS * 2,
    retry: 1,
    select: (data) => data.slice(0, 50), // Limit to 50 most recent commits
  });
}

// Hook for contribution graph data
export function useGitHubContributions() {
  return useQuery({
    queryKey: githubQueryKeys.contributions,
    queryFn: () => githubApi.getContributionData(),
    staleTime: CACHE_TIMES.CONTRIBUTIONS,
    gcTime: CACHE_TIMES.CONTRIBUTIONS * 2,
    retry: 1,
  });
}

// Hook for language statistics
export function useGitHubLanguages() {
  return useQuery({
    queryKey: githubQueryKeys.languages,
    queryFn: () => githubApi.getLanguageStats(),
    staleTime: CACHE_TIMES.LANGUAGES,
    gcTime: CACHE_TIMES.LANGUAGES * 2,
    retry: 1,
    select: (data) => {
      // Convert bytes to percentages and sort by usage
      const total = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);
      if (total === 0) return {};
      
      return Object.entries(data)
        .map(([lang, bytes]) => ({ 
          language: lang, 
          bytes, 
          percentage: (bytes / total) * 100 
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .reduce((acc, { language, bytes, percentage }) => {
          acc[language] = { bytes, percentage };
          return acc;
        }, {} as { [lang: string]: { bytes: number; percentage: number } });
    },
  });
}

// Combined hook for repository stats
export function useGitHubRepoStats() {
  const { data: repositories, isLoading, error } = useGitHubRepositories();
  
  const stats = repositories ? githubApi.getRepoStats(repositories) : null;
  
  return {
    data: stats,
    isLoading,
    error,
  };
}

// Hook for dashboard overview data
export function useGitHubDashboard() {
  const queries = useQueries({
    queries: [
      {
        queryKey: githubQueryKeys.user,
        queryFn: () => githubApi.getUser(),
        staleTime: CACHE_TIMES.USER,
      },
      {
        queryKey: githubQueryKeys.repositories,
        queryFn: () => githubApi.getRepositories(),
        staleTime: CACHE_TIMES.REPOSITORIES,
      },
      {
        queryKey: githubQueryKeys.events,
        queryFn: () => githubApi.getUserEvents(),
        staleTime: CACHE_TIMES.EVENTS,
      },
      {
        queryKey: githubQueryKeys.languages,
        queryFn: () => githubApi.getLanguageStats(),
        staleTime: CACHE_TIMES.LANGUAGES,
      },
    ],
  });

  const [userQuery, reposQuery, eventsQuery, languagesQuery] = queries;

  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const errors = queries.filter(query => query.error).map(query => query.error);

  // Combine data from all queries
  const data = {
    user: userQuery.data as GitHubUser | undefined,
    repositories: reposQuery.data as GitHubRepo[] | undefined,
    events: eventsQuery.data as GitHubEvent[] | undefined,
    languages: languagesQuery.data as GitHubLanguageStats | undefined,
    stats: reposQuery.data ? githubApi.getRepoStats(reposQuery.data) : undefined,
  };

  return {
    data,
    isLoading,
    isError,
    errors,
    refetch: () => queries.forEach(query => query.refetch()),
  };
}

// Hook for activity feed data with real-time updates
export function useGitHubActivity() {
  const eventsQuery = useGitHubEvents();
  const commitsQuery = useGitHubCommits();

  const isLoading = eventsQuery.isLoading || commitsQuery.isLoading;
  const isError = eventsQuery.isError || commitsQuery.isError;

  // Combine and sort events and commits by date
  const activities = [];
  
  if (eventsQuery.data) {
    activities.push(...eventsQuery.data.map(event => ({
      id: event.id,
      type: 'event' as const,
      action: event.type,
      date: event.created_at,
      repo: event.repo.name,
      data: event,
    })));
  }

  if (commitsQuery.data) {
    activities.push(...commitsQuery.data.map(commit => ({
      id: commit.sha,
      type: 'commit' as const,
      action: 'commit',
      date: commit.commit.author.date,
      repo: commit.repository.name,
      data: commit,
    })));
  }

  // Sort by date (most recent first) and limit
  const sortedActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  return {
    data: sortedActivities,
    isLoading,
    isError,
    error: eventsQuery.error || commitsQuery.error,
    refetch: () => {
      eventsQuery.refetch();
      commitsQuery.refetch();
    },
  };
}

// Type exports for component usage
export type GitHubActivity = ReturnType<typeof useGitHubActivity>['data'][0];
export type GitHubDashboardData = ReturnType<typeof useGitHubDashboard>['data'];