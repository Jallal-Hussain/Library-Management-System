"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, AlertTriangle, BookOpen, CheckCircle, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { mockNotifications, type Notification } from "@/lib/mock-notifications"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [settings, setSettings] = useState({
    emailOverdue: true,
    emailReservation: true,
    emailReminder: true,
    emailNewsletter: false,
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const typeIcons = {
    overdue: AlertTriangle,
    reservation: BookOpen,
    system: Bell,
    reminder: Clock,
  }

  const typeColors = {
    overdue: "text-red-600 bg-red-100",
    reservation: "text-green-600 bg-green-100",
    system: "text-blue-600 bg-blue-100",
    reminder: "text-amber-600 bg-amber-100",
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    toast.success("All notifications marked as read")
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
    toast.success("Notification deleted")
  }

  return (
    <div className="min-h-screen">
      <Header title="Notifications" subtitle="Manage alerts and notification preferences" />

      <div className="p-6">
        <Tabs defaultValue="inbox" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="inbox" className="gap-2">
                <Bell className="h-4 w-4" />
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Mail className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="bg-transparent">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>

          <TabsContent value="inbox" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                  <p className="mt-2 text-sm text-muted-foreground">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type]
                return (
                  <Card
                    key={notification.id}
                    className={cn("transition-colors", !notification.read && "border-primary/50 bg-primary/5")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("rounded-lg p-2", typeColors[notification.type])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={cn("font-semibold", !notification.read && "text-primary")}>
                                {notification.title}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {new Date(notification.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                  Mark read
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Email Notification Preferences</CardTitle>
                <CardDescription>Choose which notifications you'd like to receive via email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="overdue" className="font-medium">
                      Overdue Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">Get notified when books become overdue</p>
                  </div>
                  <Switch
                    id="overdue"
                    checked={settings.emailOverdue}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailOverdue: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reservation" className="font-medium">
                      Reservation Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">Get notified when reserved books are available</p>
                  </div>
                  <Switch
                    id="reservation"
                    checked={settings.emailReservation}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailReservation: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder" className="font-medium">
                      Due Date Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">Get reminded 3 days before books are due</p>
                  </div>
                  <Switch
                    id="reminder"
                    checked={settings.emailReminder}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailReminder: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter" className="font-medium">
                      Library Newsletter
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive monthly updates about new books and events</p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={settings.emailNewsletter}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNewsletter: checked })}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={() => toast.success("Notification preferences saved!")}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
