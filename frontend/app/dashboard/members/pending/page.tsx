"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { ApprovalCard } from "@/components/approval-card"
import { useAuth } from "@/lib/auth-context"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Clock, Users } from "lucide-react"
import { toast } from "sonner"

export default function PendingMembersPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(["admin", "librarian"])

  const [members, setMembers] = useState<User[]>(
    mockUsers.filter((u) => u.approvalStatus === "pending" || !u.approvalStatus),
  )
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.membershipId?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [members, searchQuery])

  const handleApprove = (userId: string, notes?: string) => {
    setMembers(
      members.map((m) =>
        m.id === userId
          ? { ...m, approvalStatus: "approved" as const, isActive: true }
          : m,
      ),
    )
    toast.success("Member approved successfully")
    // In real app, would send email notification here
  }

  const handleReject = (userId: string, notes?: string) => {
    setMembers(
      members.map((m) =>
        m.id === userId
          ? { ...m, approvalStatus: "rejected" as const, isActive: false }
          : m,
      ),
    )
    toast.success("Member rejected")
    // In real app, would send rejection email here
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Pending Approvals" subtitle="Access restricted to administrators" />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Pending Member Approvals" subtitle={`${filteredMembers.length} pending approval(s)`} />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredMembers.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockUsers.filter((u) => u.approvalStatus === "approved").length}
                </p>
                <p className="text-sm text-muted-foreground">Total Approved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Members */}
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Pending Approvals</h3>
              <p className="mt-2 text-sm text-muted-foreground">All member registrations have been processed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <ApprovalCard
                key={member.id}
                user={member}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


