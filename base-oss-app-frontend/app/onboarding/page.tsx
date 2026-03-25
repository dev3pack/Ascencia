"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code2, User, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { supabase } from "@/lib/supabase"

type UserRole = "contributor" | "maintainer" | null

export default function OnboardingPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [step, setStep] = useState<"role" | "profile">("role")
  const [role, setRole] = useState<UserRole>(null)

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep("profile")
  }

  const handleComplete = (savedRole: Exclude<UserRole, null>) => {
    if (savedRole === "contributor") {
      router.push("/browse")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Code2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Base OSS Match</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-16 rounded-full ${step === "role" ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-2 w-16 rounded-full ${step === "profile" ? "bg-primary" : "bg-muted"}`} />
        </div>

        {step === "role" ? (
          <Card className="p-8 bg-card border-border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome! Choose Your Role</h1>
              <p className="text-muted-foreground">How would you like to use Base OSS Match?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect("contributor")}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-colors text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contributor</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Find and contribute to Base ecosystem projects that match your skills
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect("maintainer")}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-colors text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Wrench className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Maintainer</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  List your projects and find qualified contributors for your issues
                </p>
              </button>
            </div>
          </Card>
        ) : role === "contributor" ? (
          <ContributorProfileForm
            walletAddress={address ?? null}
            role="contributor"
            onComplete={() => handleComplete("contributor")}
            onBack={() => setStep("role")}
          />
        ) : (
          <MaintainerProfileForm
            walletAddress={address ?? null}
            role="maintainer"
            onComplete={() => handleComplete("maintainer")}
            onBack={() => setStep("role")}
          />
        )}
      </div>
    </div>
  )
}

type ContributorProfileData = {
  name: string;
  bio: string;
  techStack: string;
  interests: string;
  experienceLevel: string;
};

function ContributorProfileForm({
  walletAddress,
  role,
  onComplete,
  onBack,
}: {
  walletAddress: string | null
  role: "contributor"
  onComplete: () => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<ContributorProfileData>({
    name: "",
    bio: "",
    techStack: "",
    interests: "",
    experienceLevel: "intermediate",
  });
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAddress) {
      setError("Connect your wallet to complete onboarding.")
      return
    }

    setIsSaving(true)
    setError(null)

    const techStack = formData.techStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const topics = formData.interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        wallet_address: walletAddress,
        role,
        bio: formData.bio || null,
        tech_stack: techStack,
        topics,
        experience_level: formData.experienceLevel,
      },
      { onConflict: "wallet_address" },
    )

    if (upsertError) {
      setError(upsertError.message)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onComplete()
  }

  return (
    <Card className="p-8 bg-card border-border">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Set Up Your Profile</h1>
        <p className="text-muted-foreground">Tell us about your skills so we can match you with the right projects</p>
      </div>

      {!walletAddress && <p className="text-sm text-muted-foreground mb-4">Connect your wallet to save your profile.</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="bg-background"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-background text-foreground"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="techStack">Tech Stack</Label>
          <Input
            id="techStack"
            placeholder="React, TypeScript, Solidity, Node.js"
            value={formData.techStack}
            onChange={handleInputChange}
            required
            className="bg-background"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">Comma-separated list of technologies you work with</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Interests & Topics</Label>
          <Input
            id="interests"
            placeholder="AI, DeFi, NFTs, Gaming"
            value={formData.interests}
            onChange={handleInputChange}
            className="bg-background"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">What types of projects interest you?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <select
            id="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleInputChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
            disabled={isSaving}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="bg-transparent">
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={!walletAddress || isSaving}>
            {isSaving ? "Saving…" : "Complete Setup"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

type MaintainerProfileData = {
  name: string;
  organization: string;
  bio: string;
};

function MaintainerProfileForm({
  walletAddress,
  role,
  onComplete,
  onBack,
}: {
  walletAddress: string | null
  role: "maintainer"
  onComplete: () => void;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<MaintainerProfileData>({
    name: "",
    organization: "",
    bio: "",
  });
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAddress) {
      setError("Connect your wallet to complete onboarding.")
      return
    }

    setIsSaving(true)
    setError(null)

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        wallet_address: walletAddress,
        role,
        bio: formData.bio || null,
      },
      { onConflict: "wallet_address" },
    )

    if (upsertError) {
      setError(upsertError.message)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onComplete()
  }

  return (
    <Card className="p-8 bg-card border-border">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Set Up Your Profile</h1>
        <p className="text-muted-foreground">Tell us about yourself and your projects</p>
      </div>

      {!walletAddress && <p className="text-sm text-muted-foreground mb-4">Connect your wallet to save your profile.</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="bg-background"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">Organization (Optional)</Label>
          <Input
            id="organization"
            placeholder="Your Company or Project"
            value={formData.organization}
            onChange={handleInputChange}
            className="bg-background"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            placeholder="Tell us about your projects..."
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-background text-foreground"
            disabled={isSaving}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="bg-transparent">
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={!walletAddress || isSaving}>
            {isSaving ? "Saving…" : "Complete Setup"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
