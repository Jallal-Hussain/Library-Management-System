"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { StatsCard } from "@/components/stats-card"
import { BookCard } from "@/components/book-card"
import { AlertBanner } from "@/components/alert-banner"
import { useAuth } from "@/lib/auth-context"
import { mockBooks, mockTransactions, mockDashboardStats } from "@/lib/mock-data"
import { isMembershipExpired, getExpiryWarningLevel, getDaysUntilExpiry } from "@/lib/membership-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, BookMarked, DollarSign, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/circulation-utils"

const circulationData = [
  { name: "Mon", borrowed: 24, returned: 18 },
  { name: "Tue", borrowed: 30, returned: 25 },
  { name: "Wed", borrowed: 28, returned: 32 },
  { name: "Thu", borrowed: 35, returned: 28 },
  { name: "Fri", borrowed: 42, returned: 38 },
  { name: "Sat", borrowed: 38, returned: 35 },
  { name: "Sun", borrowed: 15, returned: 12 },
]

const categoryData = [
  { name: "Fiction", value: 145, color: "#004E66" },
  { name: "Technology", value: 78, color: "#007090" },
  { name: "Science", value: 56, color: "#01A7C2" },
  { name: "History", value: 43, color: "#A0E1EB" },
  { name: "Other", value: 103, color: "#EAEBED" },
]

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()
  const isAdmin = hasRole(["admin", "librarian"])

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const recentTransactions = mockTransactions.slice(0, 5)
  const popularBooks = mockBooks.slice(0, 4)

  const userOverdueBooks = mockTransactions.filter((t) => t.status === "overdue" && (isAdmin || t.userId === user?.id))
  const userDueSoonBooks = mockTransactions.filter((t) => {
    if (t.status !== "active") return false
    const dueDate = new Date(t.dueDate)
    const today = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0 && (isAdmin || t.userId === user?.id)
  })

  const statusColors = {
    active: "bg-green-100 text-green-800",
    returned: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    lost: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.name?.split(" ")[0]}!`}
        subtitle={
          isAdmin ? "Here's what's happening in your library today" : "Manage your borrowings and discover new books"
        }
      />

      <div className="p-6">
        {!isAdmin && (
          <div className="mb-6 space-y-3">
            {userOverdueBooks.length > 0 && !dismissedAlerts.includes("overdue") && (
              <AlertBanner
                type="error"
                title="Overdue Books"
                message={`You have ${userOverdueBooks.length} overdue book(s). Please return them as soon as possible to avoid additional fines.`}
                onDismiss={() => setDismissedAlerts([...dismissedAlerts, "overdue"])}
                action={{
                  label: "View My Books",
                  onClick: () => router.push("/dashboard/my-books"),
                }}
              />
            )}
            {userDueSoonBooks.length > 0 && !dismissedAlerts.includes("dueSoon") && (
              <AlertBanner
                type="warning"
                title="Books Due Soon"
                message={`You have ${userDueSoonBooks.length} book(s) due within the next 3 days. Consider returning or renewing them.`}
                onDismiss={() => setDismissedAlerts([...dismissedAlerts, "dueSoon"])}
                action={{
                  label: "Renew Books",
                  onClick: () => router.push("/dashboard/my-books"),
                }}
              />
            )}
            {user && user.finesOwed > 0 && !dismissedAlerts.includes("fines") && (
              <AlertBanner
                type="info"
                title="Outstanding Fines"
                message={`You have ${formatCurrency(user.finesOwed)} in outstanding fines. Please settle your balance at the circulation desk.`}
                onDismiss={() => setDismissedAlerts([...dismissedAlerts, "fines"])}
              />
            )}
            {user && user.membershipExpiry && (
              <>
                {isMembershipExpired(user.membershipExpiry) && !dismissedAlerts.includes("expired") && (
                  <AlertBanner
                    type="error"
                    title="Membership Expired"
                    message="Your membership has expired. Please renew your membership to continue borrowing books."
                    onDismiss={() => setDismissedAlerts([...dismissedAlerts, "expired"])}
                    action={{
                      label: "View Profile",
                      onClick: () => router.push("/dashboard/profile"),
                    }}
                  />
                )}
                {getExpiryWarningLevel(user.membershipExpiry) === "critical" && !dismissedAlerts.includes("expiryCritical") && (
                  <AlertBanner
                    type="warning"
                    title="Membership Expiring Soon"
                    message={`Your membership expires in ${getDaysUntilExpiry(user.membershipExpiry)} days. Please renew to avoid interruption.`}
                    onDismiss={() => setDismissedAlerts([...dismissedAlerts, "expiryCritical"])}
                    action={{
                      label: "View Profile",
                      onClick: () => router.push("/dashboard/profile"),
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Books"
            value={mockDashboardStats.totalBooks.toLocaleString()}
            icon={BookOpen}
            trend={{ value: 8, isPositive: true }}
            description="this month"
          />
          <StatsCard
            title="Active Members"
            value={mockDashboardStats.totalMembers.toLocaleString()}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            description="new this month"
          />
          <StatsCard
            title="Active Loans"
            value={mockDashboardStats.activeLoans}
            icon={ArrowLeftRight}
            description="currently borrowed"
          />
          <StatsCard
            title="Overdue Books"
            value={mockDashboardStats.overdueBooks}
            icon={AlertTriangle}
            className={mockDashboardStats.overdueBooks > 5 ? "border-destructive/50" : ""}
          />
        </div>

        {/* Charts Row */}
        {isAdmin && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Circulation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Circulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={circulationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="borrowed" fill="#004E66" radius={[4, 4, 0, 0]} name="Borrowed" />
                    <Bar dataKey="returned" fill="#01A7C2" radius={[4, 4, 0, 0]} name="Returned" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  Books by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {categoryData.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-sm text-card-foreground">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{category.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{tx.bookTitle}</p>
                      <p className="text-sm text-muted-foreground">{tx.userName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn("capitalize", statusColors[tx.status])}>{tx.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due: {new Date(tx.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Popular Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {popularBooks.map((book) => (
                  <BookCard key={book.id} book={book} compact showActions={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats for Admin */}
        {isAdmin && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-[#004E66] to-[#007090] text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookMarked className="h-8 w-8 opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{mockDashboardStats.reservations}</p>
                    <p className="text-sm opacity-80">Active Reservations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#007090] to-[#01A7C2] text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(mockDashboardStats.finesCollected)}</p>
                    <p className="text-sm opacity-80">Fines Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#01A7C2] to-[#A0E1EB] text-[#004E66]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{mockDashboardStats.newMembersThisMonth}</p>
                    <p className="text-sm opacity-80">New Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#A0E1EB] to-[#EAEBED] text-[#004E66]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{mockDashboardStats.booksAddedThisMonth}</p>
                    <p className="text-sm opacity-80">Books Added</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
