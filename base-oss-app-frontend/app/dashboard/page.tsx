"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, User, Plus, GitPullRequest, AlertCircle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { supabase } from "@/lib/supabase"

type UserRole = "contributor" | "maintainer"

export default function DashboardPage() {
  const { address } = useAccount()
  const [userRole, setUserRole] = useState<UserRole>("contributor")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRole() {
      if (!address) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("wallet_address", address)
        .maybeSingle()

      if (profileError) {
        if (!cancelled) setError(profileError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const role = data?.role
      if (!cancelled) setUserRole(role === "maintainer" || role === "both" ? "maintainer" : "contributor")
      if (!cancelled) setIsLoading(false)
    }

    loadRole()
    return () => {
      cancelled = true
    }
  }, [address])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Base OSS Match</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost" size="sm">
                Browse
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <User className="h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!address && (
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground">Connect your wallet to view your dashboard.</p>
          </Card>
        )}

        {error && (
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-destructive">Failed to load dashboard: {error}</p>
          </Card>
        )}

        {isLoading && address && (
          <Card className="p-6 bg-card border-border">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </Card>
        )}
      </div>

      {!isLoading && address && !error && (userRole === "contributor" ? <ContributorDashboard /> : <MaintainerDashboard />)}
    </div>
  )
}

function ContributorDashboard() {
  const { address } = useAccount()
  const [applications, setApplications] = useState<
    { id: string; status: string; applied_at: string; issueTitle: string; repoName: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    type ApplicationQueryRow = {
      id: string
      status: string | null
      applied_at: string
      issue:
        | {
            id: string
            title: string | null
            repo:
              | {
                  id: string
                  full_name: string | null
                }
              | null
          }
        | null
    }

    async function load() {
      if (!address) return
      setIsLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from("applications")
        .select(
          `
          id,
          status,
          applied_at,
          issue:issues (
            id,
            title,
            repo:repositories (
              id,
              full_name
            )
          )
        `,
        )
        .eq("contributor_wallet", address)
        .order("applied_at", { ascending: false })
        .limit(50)

      if (queryError) {
        if (!cancelled) setError(queryError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const rows =
        ((data ?? []) as ApplicationQueryRow[]).map((row) => ({
          id: row.id as string,
          status: row.status ?? "pending",
          applied_at: row.applied_at as string,
          issueTitle: row.issue?.title ?? "Unknown issue",
          repoName: row.issue?.repo?.full_name ?? "Unknown repo",
        })) ?? []

      if (!cancelled) setApplications(rows)
      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [address])

  const stats = useMemo(() => {
    const applied = applications.length
    const accepted = applications.filter((a) => a.status === "approved" || a.status === "accepted").length
    const inProgress = 0
    const completed = 0
    return { applied, accepted, inProgress, completed }
  }, [applications])

  const notifications = [
    {
      id: 1,
      message: "Your application for 'Fix UI responsiveness' was accepted!",
      time: "1 hour ago",
      type: "success",
    },
    {
      id: 2,
      message: "New issue matching your skills: 'Add TypeScript support'",
      time: "3 hours ago",
      type: "info",
    },
    {
      id: 3,
      message: "Maintainer commented on your PR for 'Add unit tests'",
      time: "1 day ago",
      type: "info",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Contributor!</h1>
        <p className="text-muted-foreground">Track your applications and discover new opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Applied</p>
              <p className="text-2xl font-bold">{stats.applied}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Accepted</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-chart-3" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <GitPullRequest className="h-8 w-8 text-accent" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Applied Issues */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Applications</h2>
            <Link href="/browse">
              <Button size="sm">Browse More</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {error && (
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-destructive">Failed to load applications: {error}</p>
              </Card>
            )}

            {isLoading && (
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground">Loading applications…</p>
              </Card>
            )}

            {!isLoading && !error && applications.length === 0 && (
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              </Card>
            )}

            {!isLoading &&
              !error &&
              applications.map((issue) => (
                <Card key={issue.id} className="p-6 bg-card border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{issue.issueTitle}</h3>
                    <p className="text-sm text-muted-foreground">{issue.repoName}</p>
                  </div>
                  <Badge
                    variant={
                      issue.status === "accepted" ? "default" : issue.status === "in-progress" ? "secondary" : "outline"
                    }
                  >
                    {issue.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Applied {new Date(issue.applied_at).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <aside>
          <h2 className="text-2xl font-bold mb-4">Notifications</h2>
          <Card className="p-4 bg-card border-border">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <p className="text-sm leading-relaxed mb-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function MaintainerDashboard() {
  const { address } = useAccount()
  const [repos, setRepos] = useState<{ id: string; name: string; openIssues: number }[]>([])
  const [pendingApplications, setPendingApplications] = useState<
    { id: string; contributor: string; issue: string; repo: string; appliedDate: string; message: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    type RepoRow = { id: string; full_name: string | null; open_issues_count: number | null }
    type IssueRow = { id: string; repo_id: string; title: string }
    type ApplicationRow = {
      id: string
      contributor_wallet: string
      issue_id: string
      status: string | null
      cover_letter: string | null
      applied_at: string
    }

    async function load() {
      if (!address) return
      setIsLoading(true)
      setError(null)

      const { data: repoRows, error: repoError } = await supabase
        .from("repositories")
        .select("id,full_name,open_issues_count")
        .eq("maintainer_wallet", address)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (repoError) {
        if (!cancelled) setError(repoError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const repoIds = ((repoRows ?? []) as RepoRow[]).map((r) => r.id)
      const repoList = ((repoRows ?? []) as RepoRow[]).map((r) => ({
        id: r.id,
        name: r.full_name ?? "Unknown repo",
        openIssues: r.open_issues_count ?? 0,
      }))
      if (!cancelled) setRepos(repoList)

      if (repoIds.length === 0) {
        if (!cancelled) setPendingApplications([])
        if (!cancelled) setIsLoading(false)
        return
      }

      const { data: issueRows, error: issueError } = await supabase
        .from("issues")
        .select("id,repo_id,title")
        .in("repo_id", repoIds)

      if (issueError) {
        if (!cancelled) setError(issueError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const issueIds = ((issueRows ?? []) as IssueRow[]).map((i) => i.id)
      if (issueIds.length === 0) {
        if (!cancelled) setPendingApplications([])
        if (!cancelled) setIsLoading(false)
        return
      }

      const issuesById = new Map<string, { title: string; repoId: string }>()
      for (const i of (issueRows ?? []) as IssueRow[]) {
        issuesById.set(i.id, { title: i.title, repoId: i.repo_id })
      }

      const repoNameById = new Map<string, string>()
      for (const r of repoList) repoNameById.set(r.id, r.name)

      const { data: appRows, error: appError } = await supabase
        .from("applications")
        .select("id,contributor_wallet,issue_id,status,cover_letter,applied_at")
        .in("issue_id", issueIds)
        .eq("status", "pending")
        .order("applied_at", { ascending: false })
        .limit(50)

      if (appError) {
        if (!cancelled) setError(appError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const apps = ((appRows ?? []) as ApplicationRow[]).map((a) => {
        const issue = issuesById.get(a.issue_id)
        const repoName = issue ? repoNameById.get(issue.repoId) : undefined
        return {
          id: a.id,
          contributor: a.contributor_wallet ?? "Unknown",
          issue: issue?.title ?? "Unknown issue",
          repo: repoName ?? "Unknown repo",
          appliedDate: new Date(a.applied_at).toLocaleDateString(),
          message: a.cover_letter ?? "",
        }
      })

      if (!cancelled) setPendingApplications(apps)
      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [address])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Maintainer Dashboard</h1>
          <p className="text-muted-foreground">Manage your projects and review applications</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Repository
        </Button>
      </div>

      {/* Your Repositories */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Repositories</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {error && (
            <Card className="p-6 bg-card border-border md:col-span-2">
              <p className="text-sm text-destructive">Failed to load maintainer data: {error}</p>
            </Card>
          )}

          {isLoading && (
            <Card className="p-6 bg-card border-border md:col-span-2">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </Card>
          )}

          {!isLoading && !error && repos.length === 0 && (
            <Card className="p-6 bg-card border-border md:col-span-2">
              <p className="text-sm text-muted-foreground">No repositories found for this maintainer wallet.</p>
            </Card>
          )}

          {!isLoading && !error && repos.map((repo) => (
            <Card key={repo.id} className="p-6 bg-card border-border">
              <h3 className="text-xl font-semibold mb-4">{repo.name}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">{repo.openIssues}</p>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">—</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-chart-3">—</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Manage Repository
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending Applications */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pending Applications</h2>
        <div className="space-y-4">
          {!isLoading && !error && pendingApplications.length === 0 && (
            <Card className="p-6 bg-card border-border">
              <p className="text-sm text-muted-foreground">No pending applications.</p>
            </Card>
          )}

          {pendingApplications.map((application) => (
            <Card key={application.id} className="p-6 bg-card border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{application.contributor}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{application.issue}</h3>
                  <p className="text-sm text-muted-foreground">
                    {application.repo} • Applied {application.appliedDate}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 leading-relaxed">{application.message}</p>

              <div className="flex gap-3">
                <Button size="sm" className="flex-1">
                  Accept
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
