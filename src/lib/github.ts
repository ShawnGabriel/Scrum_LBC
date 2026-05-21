import { createHmac, timingSafeEqual } from "node:crypto";

export { parsePrUrl } from "./pr-url";

export interface GitHubPullRequest {
  number: number;
  state: "open" | "closed";
  merged: boolean;
  merge_commit_sha: string | null;
  title: string;
  html_url: string;
  user: { login: string } | null;
  head: { ref: string; sha: string };
  base: {
    repo: {
      html_url: string;
      owner: { login: string };
      name: string;
    };
  };
}

export class PrNotFoundError extends Error {
  constructor(message = "Pull request not found") {
    super(message);
    this.name = "PrNotFoundError";
  }
}

export class PrAuthError extends Error {
  constructor(message = "GitHub authentication failed") {
    super(message);
    this.name = "PrAuthError";
  }
}

export class PrFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrFetchError";
  }
}

export async function fetchPullRequest(
  owner: string,
  repo: string,
  number: number
): Promise<GitHubPullRequest> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new PrAuthError("GITHUB_TOKEN is not configured");
  }

  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "scrum-lbc",
      },
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    throw new PrNotFoundError();
  }
  if (res.status === 401 || res.status === 403) {
    throw new PrAuthError(`GitHub auth error (${res.status})`);
  }
  if (!res.ok) {
    throw new PrFetchError(`GitHub returned ${res.status}`);
  }

  return (await res.json()) as GitHubPullRequest;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
