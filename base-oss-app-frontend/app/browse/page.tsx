"use client"

import { SetStateAction, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Code2, Search, Star, GitFork, AlertCircle, User } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type RepoRow = {
  id: string
  github_owner: string
  github_repo: string
  full_name: string
  description: string | null
  stars: number | null
  forks: number | null
  open_issues_count: number | null
  project: {
    id: string
    name: string
    slug: string
    tech_stack: string[] | null
    topics: string[] | null
  } | null
}

type IssueCountRow = {
  repo_id: string
  is_good_first_issue: boolean | null
  status: string | null
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [repos, setRepos] = useState<RepoRow[]>([])
  const [issueCountsByRepoId, setIssueCountsByRepoId] = useState<Record<string, { open: number; goodFirst: number }>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      const { data: repoData, error: repoError } = await supabase
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
          open_issues_count,
          project:projects (
            id,
            name,
            slug,
            tech_stack,
            topics
          )
        `,
        )
        .eq("is_active", true)
        .order("stars", { ascending: false })
        .limit(50)

      if (repoError) {
        if (!cancelled) setError(repoError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const repoRows = (repoData ?? []) as unknown as RepoRow[]
      if (!cancelled) setRepos(repoRows)

      const repoIds = repoRows.map((r) => r.id)
      if (repoIds.length === 0) {
        if (!cancelled) setIssueCountsByRepoId({})
        if (!cancelled) setIsLoading(false)
        return
      }

      const { data: issueRows, error: issueError } = await supabase
        .from("issues")
        .select("repo_id,is_good_first_issue,status")
        .in("repo_id", repoIds)

      if (issueError) {
        if (!cancelled) setError(issueError.message)
        if (!cancelled) setIsLoading(false)
        return
      }

      const counts: Record<string, { open: number; goodFirst: number }> = {}
      for (const row of (issueRows ?? []) as IssueCountRow[]) {
        const repoId = row.repo_id
        if (!counts[repoId]) counts[repoId] = { open: 0, goodFirst: 0 }
        if (row.status === "open") counts[repoId].open += 1
        if (row.status === "open" && row.is_good_first_issue) counts[repoId].goodFirst += 1
      }
      if (!cancelled) setIssueCountsByRepoId(counts)
      if (!cancelled) setIsLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const allTechStack = useMemo(() => {
    const s = new Set<string>()
    for (const r of repos) for (const t of r.project?.tech_stack ?? []) s.add(t)
    return Array.from(s).sort()
  }, [repos])

  const allTopics = useMemo(() => {
    const s = new Set<string>()
    for (const r of repos) for (const t of r.project?.topics ?? []) s.add(t)
    return Array.from(s).sort()
  }, [repos])

  const toggleFilter = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item))
    } else {
      setter([...list, item])
    }
  }

  const filteredRepos = repos.filter((repo) => {
    const displayName = repo.project?.name || repo.full_name
    const description = repo.description ?? ""

    const matchesSearch =
      searchQuery === "" ||
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())

    const techStack = repo.project?.tech_stack ?? []
    const matchesTech = selectedTech.length === 0 || selectedTech.some((tech) => techStack.includes(tech))

    const topics = repo.project?.topics ?? []
    const matchesTopics = selectedTopics.length === 0 || selectedTopics.some((topic) => topics.includes(topic))

    return matchesSearch && matchesTech && matchesTopics
  })

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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Projects</h1>
          <p className="text-muted-foreground">Discover Base ecosystem projects that match your skills</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-6 bg-card border-border sticky top-24">
              <h2 className="font-semibold mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </div>

              {/* Tech Stack Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {allTechStack.map((tech) => (
                    <Badge
                      key={tech}
                      variant={selectedTech.includes(tech) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilter(tech, selectedTech, setSelectedTech)}
                    >
                      {tech}
                    </Badge>
                  ))}
                  {allTechStack.length === 0 && <p className="text-xs text-muted-foreground">No tech stack data</p>}
                </div>
              </div>

              {/* Topics Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {allTopics.map((topic) => (
                    <Badge
                      key={topic}
                      variant={selectedTopics.includes(topic) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilter(topic, selectedTopics, setSelectedTopics)}
                    >
                      {topic}
                    </Badge>
                  ))}
                  {allTopics.length === 0 && <p className="text-xs text-muted-foreground">No topic data</p>}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedTech.length > 0 || selectedTopics.length > 0 || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedTech([])
                    setSelectedTopics([])
                    setSearchQuery("")
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Card>
          </aside>

          {/* Repos List */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredRepos.length} {filteredRepos.length === 1 ? "project" : "projects"} found
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <Card className="p-6 bg-card border-border">
                  <p className="text-sm text-destructive">Failed to load projects: {error}</p>
                </Card>
              )}

              {isLoading && (
                <Card className="p-6 bg-card border-border">
                  <p className="text-sm text-muted-foreground">Loading projects…</p>
                </Card>
              )}

              {!isLoading &&
                !error &&
                filteredRepos.map((repo) => {
                  const displayName = repo.project?.name || repo.full_name
                  const owner = repo.github_owner
                  const techStack = repo.project?.tech_stack ?? []
                  const topics = repo.project?.topics ?? []
                  const counts = issueCountsByRepoId[repo.id]
                  const openIssues = counts?.open ?? repo.open_issues_count ?? 0
                  const goodFirstIssues = counts?.goodFirst ?? 0

                  return (
                    <Link key={repo.id} href={`/repo/${repo.id}`}>
                      <Card className="p-6 bg-card border-border hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{displayName}</h3>
                            <p className="text-sm text-muted-foreground">by {owner}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {repo.stars ?? 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-4 w-4" />
                              {repo.forks ?? 0}
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4 leading-relaxed">{repo.description ?? ""}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {techStack.map((tech) => (
                            <Badge key={tech} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                          {topics.map((topic) => (
                            <Badge key={topic} variant="outline">
                              {topic}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            {openIssues} open issues
                          </div>
                          {goodFirstIssues > 0 && (
                            <Badge variant="default" className="bg-chart-3 text-chart-3-foreground">
                              {goodFirstIssues} good first issues
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </Link>
                  )
                })}

              {!isLoading && !error && filteredRepos.length === 0 && (
                <Card className="p-12 bg-card border-border text-center">
                  <p className="text-muted-foreground">No projects found matching your filters</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setSelectedTech([])
                      setSelectedTopics([])
                      setSearchQuery("")
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
