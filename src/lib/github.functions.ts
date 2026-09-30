import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";
const OWNER = "chojaaoussama523-create";
const REPO = "snnseii-gm7";

async function githubFetch(path: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const githubKey = process.env["GITHUB_API_KEY"];
  if (!lovableKey || !githubKey) {
    throw new Error("GitHub connection is not configured");
  }
  const response = await fetch(`${GATEWAY_URL}/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": githubKey,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`GitHub request failed [${response.status}]: ${body}`);
    throw new Error(`GitHub request failed [${response.status}]: ${body}`);
  }
  return response.json();
}

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  isPrivate: boolean;
  license: string | null;
  topics: string[];
  ownerLogin: string;
  ownerAvatar: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorAvatar: string | null;
  date: string;
  url: string;
}

export interface IssueInfo {
  number: number;
  title: string;
  state: string;
  user: string;
  userAvatar: string;
  createdAt: string;
  comments: number;
  url: string;
  isPullRequest: boolean;
}

export interface ContributorInfo {
  login: string;
  avatar: string;
  contributions: number;
  url: string;
}

export interface RepoDashboard {
  repo: RepoInfo;
  commits: CommitInfo[];
  issues: IssueInfo[];
  languages: Record<string, number>;
  contributors: ContributorInfo[];
}

export const getRepoDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<RepoDashboard> => {
    const base = `repos/${OWNER}/${REPO}`;
    const [repo, commits, issues, languages, contributors] = await Promise.all([
      githubFetch(base),
      githubFetch(`${base}/commits?per_page=10`),
      githubFetch(`${base}/issues?state=all&per_page=10`),
      githubFetch(`${base}/languages`),
      githubFetch(`${base}/contributors?per_page=10`),
    ]);

    return {
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.subscribers_count,
        openIssues: repo.open_issues_count,
        language: repo.language,
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        size: repo.size,
        isPrivate: repo.private,
        license: repo.license?.spdx_id ?? null,
        topics: repo.topics ?? [],
        ownerLogin: repo.owner.login,
        ownerAvatar: repo.owner.avatar_url,
      },
      commits: (commits as any[]).map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.commit.author?.name ?? "Unknown",
        authorAvatar: c.author?.avatar_url ?? null,
        date: c.commit.author?.date ?? "",
        url: c.html_url,
      })),
      issues: (issues as any[]).map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        user: i.user?.login ?? "unknown",
        userAvatar: i.user?.avatar_url ?? "",
        createdAt: i.created_at,
        comments: i.comments,
        url: i.html_url,
        isPullRequest: Boolean(i.pull_request),
      })),
      languages: languages as Record<string, number>,
      contributors: (contributors as any[]).map((c) => ({
        login: c.login,
        avatar: c.avatar_url,
        contributions: c.contributions,
        url: c.html_url,
      })),
    };
  },
);
