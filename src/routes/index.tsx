import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { getRepoDashboard } from "@/lib/github.functions";

const dashboardQuery = queryOptions({
  queryKey: ["repo-dashboard"],
  queryFn: () => getRepoDashboard(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "snnseii-gm7 — Repository Dashboard" },
      {
        name: "description",
        content:
          "Live dashboard for the snnseii-gm7 GitHub repository: commits, issues, contributors and language breakdown.",
      },
      { property: "og:title", content: "snnseii-gm7 — Repository Dashboard" },
      {
        property: "og:description",
        content:
          "Live dashboard for the snnseii-gm7 GitHub repository: commits, issues, contributors and language breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const LANG_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function timeAgo(iso: string) {
  if (!iso) return "unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const { repo, commits, issues, languages, contributors } = data;

  const langTotal = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
  const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="animate-fade-up flex flex-wrap items-start gap-5">
        <img
          src={repo.ownerAvatar}
          alt={repo.ownerLogin}
          className="size-16 rounded-xl border border-border"
        />
        <div className="flex-1">
          <p className="font-mono-code text-sm text-muted-foreground">
            {repo.ownerLogin} /
          </p>
          <h1 className="text-gradient text-4xl font-bold">{repo.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {repo.description ?? "No description provided."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              {repo.isPrivate ? "Private" : "Public"}
            </span>
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              branch: {repo.defaultBranch}
            </span>
            {repo.license && (
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {repo.license}
              </span>
            )}
            {repo.topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open on GitHub
        </a>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Stars" value={repo.stars} />
        <Stat label="Forks" value={repo.forks} />
        <Stat label="Watchers" value={repo.watchers} />
        <Stat label="Open issues" value={repo.openIssues} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Recent commits">
            {commits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No commits yet.</p>
            ) : (
              <ul className="space-y-3">
                {commits.map((c) => (
                  <li key={c.sha}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                    >
                      {c.authorAvatar ? (
                        <img
                          src={c.authorAvatar}
                          alt={c.author}
                          className="size-8 rounded-full"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {c.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.author} · {timeAgo(c.date)}
                        </p>
                      </div>
                      <code className="font-mono-code text-xs text-primary">
                        {c.sha.slice(0, 7)}
                      </code>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Languages">
            {langEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No language data yet.
              </p>
            ) : (
              <>
                <div className="flex h-2 overflow-hidden rounded-full">
                  {langEntries.map(([name, bytes], i) => (
                    <div
                      key={name}
                      style={{
                        width: `${(bytes / langTotal) * 100}%`,
                        background: LANG_COLORS[i % LANG_COLORS.length],
                      }}
                    />
                  ))}
                </div>
                <ul className="mt-4 space-y-2">
                  {langEntries.map(([name, bytes], i) => (
                    <li
                      key={name}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          background: LANG_COLORS[i % LANG_COLORS.length],
                        }}
                      />
                      <span className="flex-1 text-foreground">{name}</span>
                      {((bytes / langTotal) * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel title="Contributors">
            {contributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contributor data.
              </p>
            ) : (
              <ul className="space-y-3">
                {contributors.map((c) => (
                  <li key={c.login}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary"
                    >
                      <img
                        src={c.avatar}
                        alt={c.login}
                        className="size-8 rounded-full"
                      />
                      <span className="flex-1 text-foreground">{c.login}</span>
                      <span className="text-muted-foreground">
                        {c.contributions}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Issues & pull requests">
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing open or closed yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {issues.map((i) => (
                <li key={i.number}>
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        i.state === "open"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i.isPullRequest ? "PR" : "Issue"} #{i.number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {i.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {i.user} · {timeAgo(i.createdAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Last push {timeAgo(repo.pushedAt)} · {repo.size} KB
      </footer>
    </div>
  );
}

function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-muted-foreground">
            Loading repository…
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </main>
  );
}
