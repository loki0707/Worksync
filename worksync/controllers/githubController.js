const { asyncHandler, sendSuccess, createError } = require('../utils/error');

/**
 * @route GET /api/github/pr-status?url=<github_pr_url>
 * Fetches open/merged/closed status of a GitHub PR.
 * Requires GITHUB_TOKEN in .env for higher rate limits (optional).
 */
const getPRStatus = asyncHandler(async (req, res, next) => {
  const { url } = req.query;
  if (!url) return next(createError(400, 'url query parameter is required'));

  // Parse owner/repo/number from URL like:
  // https://github.com/owner/repo/pull/42
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return next(createError(400, 'Invalid GitHub PR URL format'));

  const [, owner, repo, number] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'WorkSync-App',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(apiUrl, { headers });

    if (response.status === 404) {
      return next(createError(404, 'PR not found — check the URL or repository visibility'));
    }
    if (response.status === 403) {
      return next(createError(429, 'GitHub API rate limit reached. Set GITHUB_TOKEN in .env'));
    }
    if (!response.ok) {
      return next(createError(502, `GitHub API error: ${response.statusText}`));
    }

    const pr = await response.json();

    sendSuccess(res, 200, 'PR status fetched', {
      pr: {
        number:    pr.number,
        title:     pr.title,
        state:     pr.state,          // 'open' | 'closed'
        merged:    pr.merged,         // boolean
        mergeable: pr.mergeable,
        draft:     pr.draft,
        author:    pr.user?.login,
        authorAvatar: pr.user?.avatar_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt:  pr.merged_at,
        url:       pr.html_url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        baseBranch: pr.base?.ref,
        headBranch: pr.head?.ref,
        displayStatus: pr.merged ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED',
      },
    });
  } catch (err) {
    if (err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'TypeError') {
      return next(createError(503, 'Cannot reach GitHub API'));
    }
    next(err);
  }
});

module.exports = { getPRStatus };
