"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { mockDashboardStats, mockBooks, mockTransactions, mockCategories, mockBranches } from "@/lib/mock-data"
import type { Branch } from "@/lib/types"
import { formatCurrency } from "@/lib/circulation-utils"
import { exportToCSV, exportToPDF, generateTableHTML } from "@/lib/export-utils"
import { DateRangePicker, type DateRangeValue } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, FileText, TrendingUp, BookOpen, Users, DollarSign, Building2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { toast } from "sonner"

const monthlyData = [
  { month: "Jul", borrowed: 145, returned: 138, newMembers: 12 },
  { month: "Aug", borrowed: 168, returned: 155, newMembers: 15 },
  { month: "Sep", borrowed: 192, returned: 180, newMembers: 18 },
  { month: "Oct", borrowed: 210, returned: 198, newMembers: 14 },
  { month: "Nov", borrowed: 185, returned: 190, newMembers: 10 },
  { month: "Dec", borrowed: 220, returned: 205, newMembers: 12 },
]

const categoryData = mockCategories.slice(0, 6).map((cat, index) => ({
  name: cat.name,
  value: cat.count,
  color: ["#004E66", "#007090", "#01A7C2", "#A0E1EB", "#5BA3B5", "#8BC5D1"][index],
}))

const topBooks = mockBooks.slice(0, 5).map((book, index) => ({
  ...book,
  borrowCount: 45 - index * 8,
}))

const overdueReport = mockTransactions
  .filter((t) => t.status === "overdue")
  .map((t) => ({
    ...t,
    daysOverdue: Math.floor((new Date().getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
  }))

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "180d" })
  const [selectedBranch, setSelectedBranch] = useState<string>("all")

  const handleExportCSV = (reportType: string) => {
    let data: Record<string, unknown>[] = []
    let filename = ""

    switch (reportType) {
      case "circulation":
        data = monthlyData.map((m) => ({
          Month: m.month,
          Borrowed: m.borrowed,
          Returned: m.returned,
          "New Members": m.newMembers,
        }))
        filename = "circulation_report"
        break
      case "inventory":
        data = categoryData.map((c) => ({
          Category: c.name,
          "Book Count": c.value,
        }))
        filename = "inventory_report"
        break
      case "overdue":
        data = overdueReport.map((o) => ({
          "Book Title": o.bookTitle,
          Member: o.userName,
          "Due Date": o.dueDate,
          "Days Overdue": o.daysOverdue,
          "Fine Amount": o.fine,
        }))
        filename = "overdue_report"
        break
      case "popular":
        data = topBooks.map((b, i) => ({
          Rank: i + 1,
          Title: b.title,
          Author: b.author,
          Category: b.category,
          "Times Borrowed": b.borrowCount,
        }))
        filename = "popular_books_report"
        break
    }

    exportToCSV(data, filename)
    toast.success(`Exported ${filename}.csv`)
  }

  const handleExportPDF = (reportType: string) => {
    let title = ""
    let content = ""

    switch (reportType) {
      case "circulation":
        title = "Circulation Report"
        content = generateTableHTML(
          ["Month", "Borrowed", "Returned", "New Members"],
          monthlyData.map((m) => [m.month, String(m.borrowed), String(m.returned), String(m.newMembers)]),
        )
        break
      case "overdue":
        title = "Overdue Books Report"
        content = generateTableHTML(
          ["Book Title", "Member", "Due Date", "Days Overdue", "Fine"],
          overdueReport.map((o) => [
            o.bookTitle,
            o.userName,
            new Date(o.dueDate).toLocaleDateString(),
            String(o.daysOverdue),
            formatCurrency(o.fine),
          ]),
        )
        break
      case "popular":
        title = "Popular Books Report"
        content = generateTableHTML(
          ["Rank", "Title", "Author", "Category", "Times Borrowed"],
          topBooks.map((b, i) => [String(i + 1), b.title, b.author, b.category, String(b.borrowCount)]),
        )
        break
    }

    exportToPDF(title, content)
    toast.success(`Opening ${title} for printing`)
  }

  return (
    <div className="min-h-screen">
      <Header title="Reports & Analytics" subtitle="Library performance insights and statistics" />

      <div className="p-6">
        {/* Summary Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-[#004E66] to-[#007090] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-2xl font-bold">{mockDashboardStats.totalBooks}</p>
                  <p className="text-sm opacity-80">Total Books</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#007090] to-[#01A7C2] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-2xl font-bold">{mockDashboardStats.totalMembers}</p>
                  <p className="text-sm opacity-80">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#01A7C2] to-[#A0E1EB] text-[#004E66]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-2xl font-bold">{mockDashboardStats.activeLoans}</p>
                  <p className="text-sm opacity-80">Active Loans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#A0E1EB] to-[#EAEBED] text-[#004E66]">
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
        </div>

        {/* Filters and Export */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
                <div className="flex items-center gap-3">
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {mockBranches
                        .filter((b: Branch) => b.isActive)
                        .map((branch: Branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExportCSV("circulation")} className="bg-transparent">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExportPDF("circulation")} className="bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs defaultValue="circulation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="circulation">Circulation</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="popular">Popular Books</TabsTrigger>
          </TabsList>

          {/* Circulation Report */}
          <TabsContent value="circulation" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExportCSV("circulation")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportPDF("circulation")}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Circulation</CardTitle>
                  <CardDescription>Books borrowed vs returned over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="borrowed" fill="#004E66" name="Borrowed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="returned" fill="#01A7C2" name="Returned" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Members Trend</CardTitle>
                  <CardDescription>Monthly member registration</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="newMembers" stroke="#007090" strokeWidth={3} name="New Members" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExportCSV("inventory")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Books by Category</CardTitle>
                  <CardDescription>Distribution of library collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Summary</CardTitle>
                  <CardDescription>Current stock status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCategories.slice(0, 6).map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${(cat.count / 150) * 100}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">{cat.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overdue Report */}
          <TabsContent value="overdue">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Overdue Books Report</CardTitle>
                  <CardDescription>Books that are past their due date</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExportCSV("overdue")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExportPDF("overdue")}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {overdueReport.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No overdue books</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Fine Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueReport.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.bookTitle}</TableCell>
                          <TableCell>{item.userName}</TableCell>
                          <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{item.daysOverdue} days</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(item.fine)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Popular Books Report */}
          <TabsContent value="popular">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Most Popular Books</CardTitle>
                  <CardDescription>Top borrowed books this period</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExportCSV("popular")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExportPDF("popular")}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Times Borrowed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topBooks.map((book, index) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell className="text-muted-foreground">{book.author}</TableCell>
                        <TableCell>{book.category}</TableCell>
                        <TableCell className="text-right font-medium">{book.borrowCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
