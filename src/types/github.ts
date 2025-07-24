import { GitHubUser, GitHubRepo, GitHubEvent, GitHubCommit, ContributionDay } from '@/services/github-api';

// Extended types for component usage
export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  totalCommits: number;
  topLanguages: { language: string; percentage: number; count: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'commit' | 'repo' | 'star' | 'fork' | 'issue' | 'pr';
  action: string;
  title: string;
  description?: string;
  url: string;
  date: string;
  repo: string;
  icon: string;
}

export interface LanguageData {
  language: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface ContributionWeek {
  week: Date;
  days: ContributionDay[];
  total: number;
}

export interface RepoCardData {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  updatedAt: string;
  topics: string[];
}

export interface GitHubComponentProps {
  className?: string;
  showHeader?: boolean;
  limit?: number;
  variant?: 'default' | 'compact' | 'detailed';
}

// Chart data interfaces
export interface ContributionChartData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  color: string;
}

export interface LanguageChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RepoStatsData {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  totalSize: number;
  languages: LanguageData[];
  mostStarred: GitHubRepo | null;
  mostRecent: GitHubRepo[];
}

// Language color mapping (popular languages)
export const LANGUAGE_COLORS: { [key: string]: string } = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#fa7343',
  Kotlin: '#F18E33',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#1572B6',
  SCSS: '#c6538c',
  Vue: '#4FC08D',
  React: '#61DAFB',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  PowerShell: '#012456',
  Dockerfile: '#384d54',
  YAML: '#cb171e',
  JSON: '#292929',
  Markdown: '#083fa1',
  Default: '#858585',
};

// Activity type configurations
export const ACTIVITY_CONFIGS = {
  PushEvent: {
    icon: '📝',
    color: '#28a745',
    action: 'pushed to',
  },
  CreateEvent: {
    icon: '🆕',
    color: '#0366d6',
    action: 'created',
  },
  DeleteEvent: {
    icon: '🗑️',
    color: '#d73a49',
    action: 'deleted',
  },
  PullRequestEvent: {
    icon: '🔀',
    color: '#6f42c1',
    action: 'pull request',
  },
  IssuesEvent: {
    icon: '❗',
    color: '#28a745',
    action: 'issue',
  },
  WatchEvent: {
    icon: '⭐',
    color: '#ffd33d',
    action: 'starred',
  },
  ForkEvent: {
    icon: '🍴',
    color: '#586069',
    action: 'forked',
  },
  ReleaseEvent: {
    icon: '🚀',
    color: '#0366d6',
    action: 'released',
  },
} as const;

export type ActivityType = keyof typeof ACTIVITY_CONFIGS;

// Export all imported types for convenience
export type {
  GitHubUser,
  GitHubRepo,
  GitHubEvent,
  GitHubCommit,
  ContributionDay,
};