"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface CreateIssueFormProps {
  onSubmit?: (data: any) => void
}

export function CreateIssueForm({ onSubmit }: CreateIssueFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [assignee, setAssignee] = useState("")
  const [fundWithUbounty, setFundWithUbounty] = useState(false)
  const [bountyAmount, setBountyAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [deadline, setDeadline] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = {
      title,
      description,
      priority,
      assignee,
      fundWithUbounty,
      bountyAmount: fundWithUbounty ? bountyAmount : null,
      paymentMethod: fundWithUbounty ? paymentMethod : null,
      deadline: fundWithUbounty ? deadline : null,
    }
    onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Issue Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter issue title"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="john">John Doe</SelectItem>
                <SelectItem value="jane">Jane Smith</SelectItem>
                <SelectItem value="bob">Bob Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Checkbox
              id="fund-ubounty"
              checked={fundWithUbounty}
              onCheckedChange={(checked) => setFundWithUbounty(checked as boolean)}
            />
            <Label htmlFor="fund-ubounty" className="cursor-pointer">
              Fund via Ubounty
            </Label>
          </CardTitle>
        </CardHeader>
        
        {fundWithUbounty && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bounty-amount">Bounty Amount</Label>
              <Input
                id="bounty-amount"
                type="number"
                value={bountyAmount}
                onChange={(e) => setBountyAmount(e.target.value)}
                placeholder="Enter bounty amount"
                min="1"
                step="0.01"
                required={fundWithUbounty}
              />
            </div>

            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                  <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                  <SelectItem value="usdt">Tether (USDT)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required={fundWithUbounty}
              />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex space-x-4">
        <Button type="submit" className="flex-1">
          {fundWithUbounty ? "Create Issue & Fund Bounty" : "Create Issue"}
        </Button>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  )
}