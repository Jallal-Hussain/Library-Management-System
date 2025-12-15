"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { mockReservations } from "@/lib/mock-data"
import type { Reservation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreHorizontal, CheckCircle, XCircle, Bell, BookMarked, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchesSearch =
        res.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.userName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || res.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [reservations, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      pending: reservations.filter((r) => r.status === "pending").length,
      ready: reservations.filter((r) => r.status === "ready").length,
      fulfilled: reservations.filter((r) => r.status === "fulfilled").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    }),
    [reservations],
  )

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    ready: "bg-green-100 text-green-800",
    fulfilled: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-800",
  }

  const handleFulfill = (reservation: Reservation) => {
    setReservations(reservations.map((r) => (r.id === reservation.id ? { ...r, status: "fulfilled" } : r)))
    toast.success(`Reservation fulfilled for ${reservation.userName}`)
  }

  const handleCancel = (reservation: Reservation) => {
    setReservations(reservations.map((r) => (r.id === reservation.id ? { ...r, status: "cancelled" } : r)))
    toast.success(`Reservation cancelled`)
  }

  const handleNotify = (reservation: Reservation) => {
    setReservations(reservations.map((r) => (r.id === reservation.id ? { ...r, notificationSent: true } : r)))
    toast.success(`Notification sent to ${reservation.userName}`)
  }

  return (
    <div className="min-h-screen">
      <Header title="Reservations" subtitle="Manage book holds and reservation queue" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <BookMarked className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fulfilled}</p>
                <p className="text-sm text-muted-foreground">Fulfilled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-gray-100 p-3">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by book or member..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead className="w-[250px]">Book</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Reserve Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notified</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">#{res.queuePosition}</TableCell>
                  <TableCell className="font-medium">{res.bookTitle}</TableCell>
                  <TableCell>{res.userName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(res.reserveDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusColors[res.status])}>{res.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {res.notificationSent ? (
                      <Badge variant="outline" className="text-green-600">
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(res.status === "pending" || res.status === "ready") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {res.status === "ready" && (
                            <DropdownMenuItem onClick={() => handleFulfill(res)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Fulfilled
                            </DropdownMenuItem>
                          )}
                          {!res.notificationSent && (
                            <DropdownMenuItem onClick={() => handleNotify(res)}>
                              <Bell className="mr-2 h-4 w-4" />
                              Send Notification
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleCancel(res)} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Reservation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
