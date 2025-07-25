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
  homepage: string | null;
  language: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  visibility: 'public' | 'private';
  fork: boolean;
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

export interface ContributionStats {
  totalContributions: number;
  firstContribution: string | null;
  longestStreak: number;
  currentStreak: number;
  averageContributionsPerDay: number;
  mostActiveDay: string | null;
  contributionDays: ContributionDay[];
}

export interface EnhancedUserStats {
  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalStars: number;
  totalForks: number;
  contributionsThisYear: number;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

class GitHubAPIService {
  private baseUrl = 'https://api.github.com';
  private username: string;
  private token: string;

  constructor() {
    this.username = import.meta.env.VITE_GITHUB_USERNAME || '';
    this.token = import.meta.env.VITE_GITHUB_TOKEN || '';
    
    if (!this.username || this.username === 'yourusername') {
      console.warn('GitHub username not configured. Set VITE_GITHUB_USERNAME in your .env.local file');
    }
    
    if (!this.token || this.token === 'your-github-token-here') {
      console.warn('⚠️ GitHub token not configured. API requests are rate limited to 60/hour.');
      console.warn('To fix: Generate token at https://github.com/settings/tokens/new');
      console.warn('Required scopes: public_repo, read:user, user:email');
    } else {
      console.log('✅ GitHub API authentication configured');
    }
  }

  // Helper method to check if authentication is properly configured
  public isAuthenticated(): boolean {
    return !!(this.token && this.token !== 'your-github-token-here');
  }

  // Get authentication status details
  public getAuthStatus(): { 
    isAuthenticated: boolean; 
    hasUsername: boolean; 
    rateLimitInfo: string;
    setupInstructions?: string;
  } {
    const isAuthenticated = this.isAuthenticated();
    const hasUsername = !!(this.username && this.username !== 'yourusername');
    
    return {
      isAuthenticated,
      hasUsername,
      rateLimitInfo: isAuthenticated ? '5,000 requests/hour' : '60 requests/hour',
      setupInstructions: !isAuthenticated ? 
        'Generate token at https://github.com/settings/tokens/new with scopes: public_repo, read:user, user:email' : 
        undefined
    };
  }

  private async fetchWithCache<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Build headers with optional authentication
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Portfolio-Website',
      ...(options?.headers as Record<string, string> || {}),
    };

    // Add authorization if token is available
    if (this.token && this.token !== 'your-github-token-here') {
      headers['Authorization'] = `token ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub resource not found: ${endpoint}`);
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          
          if (rateLimitRemaining === '0') {
            const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'unknown';
            throw new Error(`GitHub API rate limit exceeded. ${this.isAuthenticated() ? 'Authenticated' : 'Unauthenticated'} limit reached. Resets at ${resetTime}. ${!this.isAuthenticated() ? 'Configure VITE_GITHUB_TOKEN to increase limits.' : ''}`);
          } else {
            throw new Error(`GitHub API access forbidden (403). ${!this.isAuthenticated() ? 'Authentication required - configure VITE_GITHUB_TOKEN.' : 'Check token permissions.'}`);
          }
        }
        if (response.status === 401) {
          throw new Error('GitHub API authentication failed. Check your VITE_GITHUB_TOKEN.');
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

  // GraphQL API endpoint and query for contribution data
  private async fetchGraphQL<T>(query: string, variables: any): Promise<T> {
    const url = 'https://api.github.com/graphql';
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v4+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Portfolio-Website',
    };

    // GraphQL requires authentication
    if (this.token && this.token !== 'your-github-token-here') {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      throw new Error('GitHub GraphQL API requires authentication. Please configure VITE_GITHUB_TOKEN.');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  async getContributionData(): Promise<ContributionDay[]> {
    // Use GraphQL API for real contribution data
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }

    if (!this.isAuthenticated()) {
      console.warn('GitHub token not configured. Falling back to commit-based contribution data.');
      return this.getContributionDataFallback();
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const query = `
        query GetContributions($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    color
                  }
                }
              }
            }
          }
        }
      `;

      const variables = {
        username: this.username,
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      };

      const data = await this.fetchGraphQL<{
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              weeks: Array<{
                contributionDays: Array<{
                  contributionCount: number;
                  date: string;
                  color: string;
                }>;
              }>;
            };
          };
        };
      }>(query, variables);

      // Extract contribution days from the GraphQL response
      const contributions: ContributionDay[] = [];
      
      if (data.user?.contributionsCollection?.contributionCalendar?.weeks) {
        data.user.contributionsCollection.contributionCalendar.weeks.forEach(week => {
          week.contributionDays.forEach(day => {
            contributions.push({
              date: day.date,
              contributionCount: day.contributionCount,
              color: day.color,
            });
          });
        });
      }

      console.log(`✅ Loaded ${contributions.length} contribution days from GitHub GraphQL API`);
      return contributions;

    } catch (error) {
      console.warn('Failed to fetch contribution data from GraphQL API, falling back to commit-based data:', error);
      return this.getContributionDataFallback();
    }
  }

  // Fallback method for contribution data when GraphQL is unavailable
  private async getContributionDataFallback(): Promise<ContributionDay[]> {
    const contributions: ContributionDay[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

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

      console.log(`⚠️ Using fallback contribution data based on ${commits.length} commits`);
    } catch (error) {
      console.warn('Failed to generate fallback contribution data:', error);
    }

    return contributions;
  }

  // Get comprehensive contribution statistics with analysis
  async getContributionStats(): Promise<ContributionStats> {
    try {
      const contributionDays = await this.getContributionData();
      
      if (contributionDays.length === 0) {
        return {
          totalContributions: 0,
          firstContribution: null,
          longestStreak: 0,
          currentStreak: 0,
          averageContributionsPerDay: 0,
          mostActiveDay: null,
          contributionDays: [],
        };
      }

      const totalContributions = contributionDays.reduce((sum, day) => sum + day.contributionCount, 0);
      const activeDays = contributionDays.filter(day => day.contributionCount > 0);
      
      // Find first contribution
      const firstContribution = activeDays.length > 0 ? 
        activeDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date : 
        null;

      // Calculate streaks
      const { longestStreak, currentStreak } = this.calculateStreaks(contributionDays);

      // Find most active day
      const mostActiveDay = contributionDays.reduce((max, day) => 
        day.contributionCount > (max?.contributionCount || 0) ? day : max,
        null as ContributionDay | null
      )?.date || null;

      // Calculate average contributions per day
      const daysInPeriod = contributionDays.length;
      const averageContributionsPerDay = daysInPeriod > 0 ? totalContributions / daysInPeriod : 0;

      return {
        totalContributions,
        firstContribution,
        longestStreak,
        currentStreak,
        averageContributionsPerDay: Math.round(averageContributionsPerDay * 100) / 100,
        mostActiveDay,
        contributionDays,
      };
    } catch (error) {
      console.error('Failed to calculate contribution stats:', error);
      throw error;
    }
  }

  // Helper method to calculate contribution streaks
  private calculateStreaks(contributionDays: ContributionDay[]): { longestStreak: number; currentStreak: number } {
    if (contributionDays.length === 0) {
      return { longestStreak: 0, currentStreak: 0 };
    }

    // Sort days by date
    const sortedDays = contributionDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    // Calculate longest streak
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i].contributionCount > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak (from today backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const dayDate = new Date(sortedDays[i].date);
      const daysDiff = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak && sortedDays[i].contributionCount > 0) {
        currentStreak++;
      } else if (daysDiff === currentStreak && sortedDays[i].contributionCount === 0) {
        break;
      }
    }

    return { longestStreak, currentStreak };
  }

  // Get enhanced user statistics using GraphQL
  async getEnhancedUserStats(): Promise<EnhancedUserStats> {
    if (!this.username) {
      throw new Error('GitHub username not configured');
    }

    if (!this.isAuthenticated()) {
      console.warn('GitHub token not configured. Using basic user stats.');
      return this.getBasicUserStats();
    }

    try {
      const query = `
        query GetEnhancedUserStats($username: String!) {
          user(login: $username) {
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalRepositoryContributions
              contributionCalendar {
                totalContributions
              }
            }
            repositories(first: 100, privacy: PUBLIC, ownerAffiliations: OWNER) {
              nodes {
                stargazerCount
                forkCount
              }
            }
          }
        }
      `;

      const variables = { username: this.username };

      const data = await this.fetchGraphQL<{
        user: {
          contributionsCollection: {
            totalCommitContributions: number;
            totalPullRequestContributions: number;
            totalIssueContributions: number;
            totalRepositoryContributions: number;
            contributionCalendar: {
              totalContributions: number;
            };
          };
          repositories: {
            nodes: Array<{
              stargazerCount: number;
              forkCount: number;
            }>;
          };
        };
      }>(query, variables);

      const contributions = data.user.contributionsCollection;
      const repos = data.user.repositories.nodes;

      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazerCount, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forkCount, 0);

      return {
        totalContributions: contributions.contributionCalendar.totalContributions,
        totalCommits: contributions.totalCommitContributions,
        totalPullRequests: contributions.totalPullRequestContributions,
        totalIssues: contributions.totalIssueContributions,
        totalStars,
        totalForks,
        contributionsThisYear: contributions.contributionCalendar.totalContributions,
      };
    } catch (error) {
      console.warn('Failed to fetch enhanced user stats, using basic stats:', error);
      return this.getBasicUserStats();
    }
  }

  // Fallback method for basic user statistics
  private async getBasicUserStats(): Promise<EnhancedUserStats> {
    try {
      const repos = await this.getRepositories();

      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

      return {
        totalContributions: 0, // Not available without GraphQL
        totalCommits: 0, // Would require expensive API calls
        totalPullRequests: 0, // Not available without GraphQL
        totalIssues: 0, // Not available without GraphQL
        totalStars,
        totalForks,
        contributionsThisYear: 0, // Not available without GraphQL
      };
    } catch (error) {
      console.error('Failed to get basic user stats:', error);
      return {
        totalContributions: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalStars: 0,
        totalForks: 0,
        contributionsThisYear: 0,
      };
    }
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
  contributionStats: ['github', 'contribution-stats'] as const,
  enhancedUserStats: ['github', 'enhanced-user-stats'] as const,
  languages: ['github', 'languages'] as const,
  repoLanguages: (repo: string) => ['github', 'repo-languages', repo] as const,
};