// GitHub API types
export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  company: string;
  location: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  visibility: 'public' | 'private';
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  repository: {
    name: string;
    full_name: string;
  };
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  repo: {
    name: string;
    url: string;
  };
  payload: any;
  created_at: string;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

class GitHubAPIService {
  private baseUrl = 'https://api.github.com';
  private username: string;

  constructor() {
    this.username = import.meta.env.VITE_GITHUB_USERNAME || '';
    if (!this.username || this.username === 'yourusername') {
      console.warn('GitHub username not configured. Set VITE_GITHUB_USERNAME in your .env.local file');
    }
  }

  private async fetchWithCache<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-Website',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub resource not found: ${endpoint}`);
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async getUser(): Promise<GitHubUser> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    return this.fetchWithCache<GitHubUser>(`/users/${this.username}`);
  }

  async getRepositories(sort: 'updated' | 'created' | 'pushed' = 'updated'): Promise<GitHubRepo[]> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    return this.fetchWithCache<GitHubRepo[]>(
      `/users/${this.username}/repos?sort=${sort}&per_page=100&type=owner`
    );
  }

  async getRepository(repoName: string): Promise<GitHubRepo> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    return this.fetchWithCache<GitHubRepo>(`/repos/${this.username}/${repoName}`);
  }

  async getRepositoryLanguages(repoName: string): Promise<GitHubLanguageStats> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    return this.fetchWithCache<GitHubLanguageStats>(`/repos/${this.username}/${repoName}/languages`);
  }

  async getUserEvents(): Promise<GitHubEvent[]> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    return this.fetchWithCache<GitHubEvent[]>(`/users/${this.username}/events?per_page=30`);
  }

  async getUserCommits(repoName?: string): Promise<GitHubCommit[]> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }
    
    if (repoName) {
      return this.fetchWithCache<GitHubCommit[]>(
        `/repos/${this.username}/${repoName}/commits?author=${this.username}&per_page=50`
      );
    } else {
      // Get commits across all repositories
      const repos = await this.getRepositories();
      const allCommits: GitHubCommit[] = [];
      
      for (const repo of repos.slice(0, 10)) { // Limit to avoid rate limiting
        try {
          const commits = await this.fetchWithCache<GitHubCommit[]>(
            `/repos/${this.username}/${repo.name}/commits?author=${this.username}&per_page=10`
          );
          allCommits.push(...commits.map(commit => ({
            ...commit,
            repository: {
              name: repo.name,
              full_name: repo.full_name,
            },
          })));
        } catch (error) {
          console.warn(`Failed to fetch commits for ${repo.name}:`, error);
        }
      }
      
      return allCommits.sort((a, b) => 
        new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
      );
    }
  }

  async getContributionData(): Promise<ContributionDay[]> {
    // Note: GitHub's contribution graph data is not available via public API
    // This is a simplified mock implementation
    // In a real implementation, you might use GraphQL API with authentication
    // or scrape the contribution graph HTML
    
    const contributions: ContributionDay[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    // Generate mock contribution data based on commit activity
    try {
      const commits = await this.getUserCommits();
      const commitsByDate: { [date: string]: number } = {};

      commits.forEach(commit => {
        const date = commit.commit.author.date.split('T')[0];
        commitsByDate[date] = (commitsByDate[date] || 0) + 1;
      });

      // Generate all days in the past year
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = commitsByDate[dateStr] || 0;
        
        let color = '#ebedf0'; // No contributions
        if (count > 0) color = '#c6e48b'; // Low
        if (count > 2) color = '#7bc96f'; // Medium
        if (count > 4) color = '#239a3b'; // High
        if (count > 8) color = '#196027'; // Very high

        contributions.push({
          date: dateStr,
          contributionCount: count,
          color,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.warn('Failed to generate contribution data:', error);
    }

    return contributions;
  }

  async getLanguageStats(): Promise<GitHubLanguageStats> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }

    try {
      const repos = await this.getRepositories();
      const allLanguages: GitHubLanguageStats = {};

      for (const repo of repos) {
        if (repo.language) {
          try {
            const languages = await this.getRepositoryLanguages(repo.name);
            for (const [lang, bytes] of Object.entries(languages)) {
              allLanguages[lang] = (allLanguages[lang] || 0) + bytes;
            }
          } catch (error) {
            console.warn(`Failed to fetch languages for ${repo.name}:`, error);
          }
        }
      }

      return allLanguages;
    } catch (error) {
      console.error('Failed to get language stats:', error);
      return {};
    }
  }

  // Utility methods for data processing
  getRepoStats(repos: GitHubRepo[]): {
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    totalSize: number;
    languageDistribution: { [lang: string]: number };
    mostStarredRepo: GitHubRepo | null;
    recentlyUpdated: GitHubRepo[];
  } {
    const totalRepos = repos.length;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalSize = repos.reduce((sum, repo) => sum + repo.size, 0);
    
    const languageDistribution: { [lang: string]: number } = {};
    repos.forEach(repo => {
      if (repo.language) {
        languageDistribution[repo.language] = (languageDistribution[repo.language] || 0) + 1;
      }
    });

    const mostStarredRepo = repos.reduce((max, repo) => 
      repo.stargazers_count > (max?.stargazers_count || 0) ? repo : max, 
      null as GitHubRepo | null
    );

    const recentlyUpdated = repos
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);

    return {
      totalRepos,
      totalStars,
      totalForks,
      totalSize,
      languageDistribution,
      mostStarredRepo,
      recentlyUpdated,
    };
  }
}

// Export singleton instance
export const githubApi = new GitHubAPIService();

// Query keys for TanStack Query
export const githubQueryKeys = {
  user: ['github', 'user'] as const,
  repositories: ['github', 'repositories'] as const,
  repository: (name: string) => ['github', 'repository', name] as const,
  events: ['github', 'events'] as const,
  commits: (repo?: string) => ['github', 'commits', repo] as const,
  contributions: ['github', 'contributions'] as const,
  languages: ['github', 'languages'] as const,
  repoLanguages: (repo: string) => ['github', 'repo-languages', repo] as const,
};