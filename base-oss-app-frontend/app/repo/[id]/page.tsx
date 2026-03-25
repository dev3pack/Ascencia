"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Star, GitFork, ExternalLink, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAccount } from "wagmi"
import { supabase } from "@/lib/supabase"

type RepoDetailRow = {
  id: string
  github_owner: string
  github_repo: string
  full_name: string
  description: string | null
  stars: number | null
  forks: number | null
  project: {
    id: string
    name: string
    slug: string
    description: string | null
    website_url: string | null
    tech_stack: string[] | null
    topics: string[] | null
  } | null
}

type IssueRow = {
  id: string
  title: string
  description: string | null
  difficulty: "easy" | "medium" | "hard" | null
  status: string | null
  is_good_first_issue: boolean | null
  url: string
}

export default function RepoDetailPage() {
  const params = useParams<{ id: string }>()
  const repoId = params?.id

  const { address } = useAccount()

  const [repo, setRepo] = useState<RepoDetailRow | null>(null)
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!repoId) return
      setIsLoading(true)
      setError(null)

      const { data: repoRow, error: repoError } = await supabase
        .from("repositories")
        .select(
          `
          id,
          github_owner,
          github_repo,
          full_name,
          description,
          stars,
          forks,
          project:projects (
            id,
            name,
            slug,
            description,
            website_url,
            tech_stack,
            topics
          )
        `,
        )
        .eq("id", repoId)
        .single()

      if (repoError) {
        if (!cancelled) setError(repoError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      if (!cancelled) setRepo((repoRow ?? null) as RepoDetailRow | null)

      const { data: issueRows, error: issueError } = await supabase
        .from("issues")
        .select("id,title,description,difficulty,status,is_good_first_issue,url")
        .eq("repo_id", repoId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50)

      if (issueError) {
        if (!cancelled) setError(issueError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      if (!cancelled) setIssues((issueRows ?? []) as IssueRow[])
      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [repoId])

  const repoDisplayName = useMemo(() => repo?.project?.name || repo?.full_name || "", [repo])
  const repoOwner = useMemo(() => repo?.github_owner || "", [repo])

  const handleApply = (issueId: string) => {
    setSelectedIssue(issueId)
    setApplicationMessage("")
    setSubmitError(null)
    setShowApplicationModal(true)
  }

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <User className="h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="p-6 bg-card border-border mb-6">
            <p className="text-sm text-destructive">Failed to load repository: {error}</p>
          </Card>
        )}

        {isLoading && (
          <Card className="p-6 bg-card border-border mb-6">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </Card>
        )}

        {/* Repo Header */}
        {!isLoading && !error && repo && (
          <Card className="p-6 bg-card border-border mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{repoDisplayName}</h1>
              <p className="text-muted-foreground">by {repoOwner}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-5 w-5" />
                {repo.stars ?? 0}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <GitFork className="h-5 w-5" />
                {repo.forks ?? 0}
              </div>
            </div>
          </div>

          <p className="text-lg mb-4 leading-relaxed">{repo.description ?? repo.project?.description ?? ""}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(repo.project?.tech_stack ?? []).map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
            {(repo.project?.topics ?? []).map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent" asChild>
              <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            {repo.project?.website_url && (
              <Button variant="outline" className="gap-2 bg-transparent" asChild>
                <a href={repo.project.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Website
                </a>
              </Button>
            )}
          </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* About Section */}
          <aside className="lg:col-span-1">
            <Card className="p-6 bg-card border-border">
              <h2 className="font-semibold mb-4">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {repo?.project?.description ?? repo?.description ?? "No description available."}
              </p>
            </Card>
          </aside>

          {/* Issues Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Open Issues</h2>
              <p className="text-muted-foreground">Apply to issues that match your skills</p>
            </div>

            <div className="space-y-4">
              {!isLoading && !error && issues.length === 0 && (
                <Card className="p-6 bg-card border-border">
                  <p className="text-sm text-muted-foreground">No open issues found for this repository.</p>
                </Card>
              )}

              {issues.map((issue) => (
                <Card key={issue.id} className="p-6 bg-card border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                        {issue.is_good_first_issue && (
                          <Badge variant="default" className="bg-chart-3 text-chart-3-foreground">
                            Good First Issue
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3 leading-relaxed">{issue.description ?? ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {issue.difficulty ?? "unknown"}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        View on GitHub
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent" asChild>
                        <a href={issue.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button onClick={() => handleApply(issue.id)} size="sm">
                      Apply
                    </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 bg-card border-border">
            <h2 className="text-2xl font-bold mb-4">Apply to Issue</h2>
            <p className="text-muted-foreground mb-6">
              Tell the maintainer why you&apos;re a good fit for this issue and your approach to solving it.
            </p>

            {!address && (
              <Card className="p-3 bg-card border-border mb-4">
                <p className="text-sm text-muted-foreground">Connect your wallet to apply.</p>
              </Card>
            )}

            {submitError && <p className="text-sm text-destructive mb-3">{submitError}</p>}

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!selectedIssue) return
                if (!address) {
                  setSubmitError("Wallet not connected.")
                  return
                }

                setIsSubmitting(true)
                setSubmitError(null)

                const { error: insertError } = await supabase.from("applications").insert({
                  contributor_wallet: address,
                  issue_id: selectedIssue,
                  cover_letter: applicationMessage,
                })

                if (insertError) {
                  setSubmitError(insertError.message)
                  setIsSubmitting(false)
                  return
                }

                setIsSubmitting(false)
                setShowApplicationModal(false)
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Application Message
                </label>
                <textarea
                  id="message"
                  placeholder="Explain your experience and approach..."
                  className="w-full min-h-32 px-3 py-2 rounded-md border border-input bg-background text-foreground"
                  required
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApplicationModal(false)}
                  className="flex-1 bg-transparent"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!address || isSubmitting}>
                  Submit Application
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
