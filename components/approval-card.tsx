"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Clock, Mail, Calendar, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { User as UserType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ApprovalCardProps {
  user: UserType
  onApprove: (userId: string, notes?: string) => void
  onReject: (userId: string, notes?: string) => void
}

export function ApprovalCard({ user, onApprove, onReject }: ApprovalCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAction = () => {
    if (actionType === "approve") {
      onApprove(user.id, notes || undefined)
      toast.success(`${user.name} has been approved`)
    } else if (actionType === "reject") {
      onReject(user.id, notes || undefined)
      toast.success(`${user.name} has been rejected`)
    }
    setShowNotes(false)
    setNotes("")
    setActionType(null)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
                {user.phone && (
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                )}
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined: {new Date(user.joinDate).toLocaleDateString()}
              </span>
              {user.membershipId && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  ID: {user.membershipId}
                </span>
              )}
            </div>

            {user.address && (
              <p className="text-sm text-muted-foreground">{user.address}</p>
            )}

            {!showNotes ? (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setActionType("approve")
                    setShowNotes(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setActionType("reject")
                    setShowNotes(true)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Label htmlFor={`notes-${user.id}`}>
                  {actionType === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Optional)"}
                </Label>
                <Textarea
                  id={`notes-${user.id}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === "approve" ? "Add any notes..." : "Explain the reason for rejection..."}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAction} className={cn(actionType === "approve" && "bg-green-600 hover:bg-green-700")}>
                    {actionType === "approve" ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Approval
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNotes(false)
                      setNotes("")
                      setActionType(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


