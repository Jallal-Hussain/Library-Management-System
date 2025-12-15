"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdminReset?: boolean
  userName?: string
}

export function ChangePasswordDialog({ open, onOpenChange, isAdminReset = false, userName }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "" }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 2) return { strength: (strength / 5) * 100, label: "Weak", color: "bg-red-500" }
    if (strength <= 3) return { strength: (strength / 5) * 100, label: "Fair", color: "bg-amber-500" }
    if (strength <= 4) return { strength: (strength / 5) * 100, label: "Good", color: "bg-blue-500" }
    return { strength: 100, label: "Strong", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAdminReset && !currentPassword) {
      toast.error("Please enter your current password")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Mock password change - in production, this would call an API
    toast.success(isAdminReset ? `Password reset for ${userName}` : "Password changed successfully")
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset()
      onOpenChange(open)
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isAdminReset ? "Reset Password" : "Change Password"}
          </DialogTitle>
          <DialogDescription>
            {isAdminReset
              ? `Reset password for ${userName || "this user"}`
              : "Update your account password. Make sure it's strong and secure."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isAdminReset && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={cn(
                      passwordStrength.label === "Weak" && "text-red-600",
                      passwordStrength.label === "Fair" && "text-amber-600",
                      passwordStrength.label === "Good" && "text-blue-600",
                      passwordStrength.label === "Strong" && "text-green-600"
                    )}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <Progress value={passwordStrength.strength} className="h-2" />
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Password should contain:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                        At least 8 characters {newPassword.length >= 8 && <CheckCircle className="inline h-3 w-3" />}
                      </li>
                      <li className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                        Upper and lowercase letters {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && <CheckCircle className="inline h-3 w-3" />}
                      </li>
                      <li className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                        At least one number {/\d/.test(newPassword) && <CheckCircle className="inline h-3 w-3" />}
                      </li>
                      <li className={/[^a-zA-Z\d]/.test(newPassword) ? "text-green-600" : ""}>
                        Special character {/[^a-zA-Z\d]/.test(newPassword) && <CheckCircle className="inline h-3 w-3" />}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">Passwords do not match</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              handleReset()
              onOpenChange(false)
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={newPassword !== confirmPassword || newPassword.length < 6}>
              {isAdminReset ? "Reset Password" : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


