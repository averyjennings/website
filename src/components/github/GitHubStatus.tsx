import { useEffect, useState } from 'react';
import { githubApi } from '@/services/github-api';

interface GitHubStatusProps {
  className?: string;
}

export function GitHubStatus({ className = '' }: GitHubStatusProps) {
  const [authStatus, setAuthStatus] = useState(githubApi.getAuthStatus());

  useEffect(() => {
    // Update status in case environment changes
    setAuthStatus(githubApi.getAuthStatus());
  }, []);

  if (authStatus.isAuthenticated && authStatus.hasUsername) {
    return (
      <div className={`rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              GitHub Integration Active
            </h3>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              API Rate Limit: {authStatus.rateLimitInfo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            GitHub Token Configuration Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p className="mb-2">
              Current rate limit: {authStatus.rateLimitInfo}. GitHub integration features are limited without authentication.
            </p>
            
            {!authStatus.isAuthenticated && (
              <div className="space-y-2">
                <p className="font-medium">To enable full GitHub integration:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    <a 
                      href="https://github.com/settings/tokens/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                    >
                      Generate a Personal Access Token
                    </a>
                  </li>
                  <li>Select scopes: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">public_repo</code>, <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">read:user</code>, <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">user:email</code></li>
                  <li>Add <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">VITE_GITHUB_TOKEN=your_token_here</code> to your .env.local file</li>
                  <li>Update the same variable in your Vercel deployment settings</li>
                </ol>
                
                <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded border border-yellow-300 dark:border-yellow-700">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                    Benefits of authentication:
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Increased rate limit: 60/hour → 5,000/hour</li>
                    <li>• Access to real repository statistics</li>
                    <li>• Recent activity and contribution data</li>
                    <li>• Language distribution analytics</li>
                  </ul>
                </div>
              </div>
            )}
            
            {!authStatus.hasUsername && (
              <p className="mt-2">
                Also ensure <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">VITE_GITHUB_USERNAME</code> is set to your GitHub username.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitHubStatus;