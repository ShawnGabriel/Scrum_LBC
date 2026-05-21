const PR_URL_RE = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/pull\/(\d+)\/?(?:[?#].*)?$/;

export function parsePrUrl(input: string): {
  owner: string;
  repo: string;
  number: number;
} | null {
  const url = input.trim();
  const match = url.match(PR_URL_RE);
  if (!match) return null;
  const [, owner, repo, num] = match;
  return {
    owner: owner.toLowerCase(),
    repo: repo.toLowerCase(),
    number: Number.parseInt(num, 10),
  };
}
