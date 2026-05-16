"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, BookOpen, DollarSign, Calendar, Mail, Phone, MapPin, Edit, Save, AlertTriangle, Lock } from "lucide-react"
import { toast } from "sonner"
import type { User as UserType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { isMembershipExpired, getDaysUntilExpiry, getExpiryWarningLevel, formatExpiryDate } from "@/lib/membership-utils"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { MAX_FINE_THRESHOLD, formatCurrency } from "@/lib/circulation-utils"

interface MemberProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: UserType | null
  onMemberUpdated?: (member: UserType) => void
  isEditable?: boolean
}

export function MemberProfileDialog({
  open,
  onOpenChange,
  member,
  onMemberUpdated,
  isEditable = false,
}: MemberProfileDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<UserType>>({})

  if (!member) return null

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

  const handleEdit = () => {
    setEditData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      membershipExpiry: member.membershipExpiry,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (onMemberUpdated) {
      onMemberUpdated({ ...member, ...editData })
    }
    setIsEditing(false)
    toast.success("Member profile updated")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Profile
          </DialogTitle>
          <DialogDescription>View and manage member information</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="font-semibold text-lg"
                />
              ) : (
                <h3 className="text-lg font-semibold">{member.name}</h3>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("capitalize", roleColors[member.role])}>{member.role}</Badge>
                <span className="text-sm text-muted-foreground font-mono">{member.membershipId}</span>
              </div>
            </div>
            {isEditable && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-sm">{member.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-sm">{member.phone || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-sm">{member.address || "Not provided"}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Member since {new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.membershipExpiry || ""}
                      onChange={(e) => setEditData({ ...editData, membershipExpiry: e.target.value || undefined })}
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        Expires: {formatExpiryDate(member.membershipExpiry)}
                      </span>
                      {member.membershipExpiry && (
                        <>
                          {getExpiryWarningLevel(member.membershipExpiry) === "expired" && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                          {getExpiryWarningLevel(member.membershipExpiry) === "critical" && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {getDaysUntilExpiry(member.membershipExpiry)} days left
                            </Badge>
                          )}
                          {getExpiryWarningLevel(member.membershipExpiry) === "warning" && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              Expires soon
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {member.currentBorrows} / {member.borrowingLimit}
                      </p>
                      <p className="text-sm text-muted-foreground">Books Borrowed</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={cn(member.finesOwed > MAX_FINE_THRESHOLD && "border-destructive/50")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", member.finesOwed > 0 ? "bg-red-100" : "bg-green-100")}>
                      <DollarSign className={cn("h-5 w-5", member.finesOwed > 0 ? "text-red-600" : "text-green-600")} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-2xl font-bold", member.finesOwed > 0 && "text-destructive")}>
                        {formatCurrency(member.finesOwed)}
                      </p>
                      <p className="text-sm text-muted-foreground">Outstanding Fines</p>
                      {member.finesOwed > MAX_FINE_THRESHOLD && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Checkout Blocked
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <div className="flex justify-between w-full">
              {isEditable && (
                <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        isAdminReset={isEditable}
        userName={member?.name}
      />
    </Dialog>
  )
}
