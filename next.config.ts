import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { OWNER } from "./src/app/_config/owner";

type VersionInfo = {
	version: string;
	buildId: string;
};

type CompareScriptResult = {
	totalCommits?: number;
	buildId?: string;
	error?: string;
};

function shortSha(raw: string | undefined): string {
	return (raw ?? "").trim().slice(0, 7) || "unknown";
}

function versionFromCommitCount(commitCount: number): string {
	const major = Math.floor(commitCount / 100);
	const minor = Math.floor((commitCount % 100) / 10);
	const patch = commitCount % 10;
	return `${major}.${minor}.${patch}`;
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  VERSIONING  —  configured in src/app/_config/owner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  OPTION A  Manual (simplest) — recommended for most users
 *  ─────────────────────────────────────────────────────────
 *  Open src/app/_config/owner.ts and set the `version` field:
 *    version: "1.0.0"
 *
 *  That's it. The build ID is taken from the Git commit SHA automatically
 *  (Vercel sets VERCEL_GIT_COMMIT_SHA; nothing extra needed).
 *
 *  OPTION B  Auto (commit-count based) — for advanced users
 *  ──────────────────────────────────────────────────────────
 *  Leave `version: ""` in owner.ts and add these to your Vercel env vars:
 *
 *    PORTFOLIO_REPO_OWNER   Your GitHub username
 *    PORTFOLIO_REPO_NAME    Your repository name
 *    PORTFOLIO_BASE_SHA     Commit SHA to treat as v0.0.0 — every commit
 *                           after it increments the version number
 *                           e.g. 42 commits → v0.4.2, 123 → v1.2.3
 *    GITHUB_KEY             GitHub PAT with repo read access (store as a
 *    (or GITHUB_TOKEN /     Vercel secret) — calls the GitHub Compare API
 *     GH_TOKEN)
 *
 *  VERCEL_GIT_COMMIT_SHA is set automatically by Vercel.
 *
 *  If neither option is configured the app shows v0.0.0 / unknown.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function computeLiveVersionInfo(): VersionInfo {
	// Option A: version set in src/app/_config/owner.ts — skips the API.
	const manual = (OWNER.version ?? "").trim();
	if (manual) {
		return {
			version: manual,
			buildId: shortSha(process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA),
		};
	}

	// Option B: derive version from commit count via GitHub Compare API.
	const owner = process.env.PORTFOLIO_REPO_OWNER ?? "";
	const repo = process.env.PORTFOLIO_REPO_NAME ?? "";
	const baseSha = (process.env.PORTFOLIO_BASE_SHA ?? "").trim();
	const headSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "").trim();
	const token = (process.env.GITHUB_KEY ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "").trim();

	if (!baseSha || !headSha || !token) {
		const missing: string[] = [];
		if (!baseSha) missing.push("PORTFOLIO_BASE_SHA");
		if (!headSha) missing.push("VERCEL_GIT_COMMIT_SHA/GITHUB_SHA");
		if (!token) missing.push("GITHUB_KEY/GITHUB_TOKEN/GH_TOKEN");
		console.warn(`[os-version] Fallback to 0.0.0 due to missing env: ${missing.join(", ")}`);
		return {
			version: "0.0.0",
			buildId: shortSha(headSha),
		};
	}

	try {
		const script = [
			"(async () => {",
			`  const owner = ${JSON.stringify(owner)};`,
			`  const repo = ${JSON.stringify(repo)};`,
			`  const baseSha = ${JSON.stringify(baseSha)};`,
			`  const headSha = ${JSON.stringify(headSha)};`,
			`  const token = ${JSON.stringify(token)};`,
			'  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/compare/" + baseSha + "..." + headSha;',
			'  const res = await fetch(url, {',
			'    headers: {',
			'      Accept: "application/vnd.github+json",',
			'      "X-GitHub-Api-Version": "2022-11-28",',
			'      Authorization: "Bearer " + token,',
			'    },',
			'  });',
			'  if (!res.ok) {',
			'    const msg = await res.text();',
			'    console.log(JSON.stringify({',
			'      totalCommits: 0,',
			'      buildId: headSha.slice(0, 7) || "unknown",',
			'      error: "HTTP " + res.status + " " + msg.slice(0, 300),',
			'    }));',
			'    return;',
			'  }',
			'  const data = await res.json();',
			'  console.log(JSON.stringify({',
			'    totalCommits: Number(data.total_commits ?? 0),',
			'    buildId: headSha.slice(0, 7) || "unknown",',
			'    error: "",',
			'  }));',
			'})().catch(() => {',
			'  const headSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";',
			'  console.log(JSON.stringify({ totalCommits: 0, buildId: headSha.slice(0, 7) || "unknown", error: "compare script crashed" }));',
			'});',
		].join("\n");

		const raw = execFileSync(process.execPath, ["-e", script], {
			encoding: "utf8",
			env: process.env,
		}).trim();
		const parsed = JSON.parse(raw) as CompareScriptResult;
		if (parsed.error) {
			console.warn(`[os-version] Compare API fallback reason: ${parsed.error}`);
		}
		const totalCommits = Number(parsed.totalCommits ?? 0);
		if (!Number.isFinite(totalCommits) || totalCommits < 0) {
			console.warn("[os-version] Compare API returned invalid totalCommits; using 0.");
		}
		return {
			version: versionFromCommitCount(
				Number.isFinite(totalCommits) && totalCommits >= 0 ? totalCommits : 0,
			),
			buildId: parsed.buildId || shortSha(headSha),
		};
	} catch {
		console.warn("[os-version] Compare API execution failed; fallback to 0.0.0.");
		return {
			version: "0.0.0",
			buildId: shortSha(headSha),
		};
	}
}

const versionInfo = computeLiveVersionInfo();

const nextConfig: NextConfig = {
	outputFileTracingRoot: process.cwd(),
	env: {
		NEXT_PUBLIC_OS_VERSION: versionInfo.version,
		NEXT_PUBLIC_OS_BUILD_ID: versionInfo.buildId,
	},
};

export default nextConfig;