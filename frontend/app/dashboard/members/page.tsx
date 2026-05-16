"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { MemberProfileDialog } from "@/components/member-profile-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Eye, Edit, Ban, Mail, Filter, Database, AlertTriangle, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatExpiryDate, getExpiryWarningLevel } from "@/lib/membership-utils"
import { MAX_FINE_THRESHOLD, formatCurrency } from "@/lib/circulation-utils"

export default function MembersPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(["admin", "librarian"])

  const [members, setMembers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [approvalFilter, setApprovalFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<User | null>(null)

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.membershipId?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === "all" || member.role === roleFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && member.isActive) ||
        (statusFilter === "inactive" && !member.isActive)
      const matchesApproval =
        approvalFilter === "all" ||
        (approvalFilter === "pending" && member.approvalStatus === "pending") ||
        (approvalFilter === "approved" && (member.approvalStatus === "approved" || !member.approvalStatus)) ||
        (approvalFilter === "rejected" && member.approvalStatus === "rejected")

      return matchesSearch && matchesRole && matchesStatus && matchesApproval
    })
  }, [members, searchQuery, roleFilter, statusFilter, approvalFilter])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    librarian: "bg-blue-100 text-blue-800",
    patron: "bg-green-100 text-green-800",
  }

  const handleMemberAdded = (newMember: User) => {
    setMembers([newMember, ...members])
  }

  const handleViewProfile = (member: User) => {
    setSelectedMember(member)
    setIsProfileDialogOpen(true)
  }

  const handleMemberUpdated = (updatedMember: User) => {
    setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)))
  }

  const handleToggleStatus = (member: User) => {
    setMembers(members.map((m) => (m.id === member.id ? { ...m, isActive: !m.isActive } : m)))
    toast.success(`${member.name} has been ${member.isActive ? "deactivated" : "activated"}`)
  }

  return (
    <div className="min-h-screen">
      <Header title="Members" subtitle={`${filteredMembers.length} members`} />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="librarian">Librarian</SelectItem>
                  <SelectItem value="patron">Patron</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => toast.info("Student DB import functionality coming soon")}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Import from Student DB
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Member</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-center">Borrowed</TableHead>
                <TableHead className="text-right">Fines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-card-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{member.membershipId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={cn("capitalize w-fit", roleColors[member.role])}>{member.role}</Badge>
                      {member.approvalStatus === "pending" && (
                        <Badge variant="outline" className="w-fit bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.membershipExpiry ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatExpiryDate(member.membershipExpiry)}</span>
                        {getExpiryWarningLevel(member.membershipExpiry) === "expired" && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        )}
                        {getExpiryWarningLevel(member.membershipExpiry) === "critical" && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Soon
                          </Badge>
                        )}
                        {getExpiryWarningLevel(member.membershipExpiry) === "warning" && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">Warning</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No expiry</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{member.currentBorrows}</span>
                    <span className="text-muted-foreground"> / {member.borrowingLimit}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.finesOwed > 0 ? (
                      <span className="font-medium text-destructive">{formatCurrency(member.finesOwed)}</span>
                    ) : (
                      <span className="text-muted-foreground">{formatCurrency(0)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {member.finesOwed > MAX_FINE_THRESHOLD && (
                        <Badge variant="destructive" className="text-xs w-fit">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Emailing ${member.name}`)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleToggleStatus(member)}>
                              <Ban className="mr-2 h-4 w-4" />
                              {member.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddMemberDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onMemberAdded={handleMemberAdded} />

      <MemberProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        member={selectedMember}
        onMemberUpdated={handleMemberUpdated}
        isEditable={isAdmin}
      />
    </div>
  )
}
