"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Clock,
  CheckCircle,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ILLRequest {
  id: string
  type: "outgoing" | "incoming"
  bookTitle: string
  isbn?: string
  partnerLibrary: string
  requestDate: string
  dueDate?: string
  status: "requested" | "approved" | "shipped" | "received" | "returned"
  patronName?: string
  notes?: string
}

const mockILLRequests: ILLRequest[] = [
  {
    id: "1",
    type: "outgoing",
    bookTitle: "Advanced Algorithms and Data Structures",
    isbn: "978-1617295485",
    partnerLibrary: "Central Public Library",
    requestDate: "2024-12-01",
    status: "received",
    patronName: "John Smith",
    dueDate: "2024-12-29",
  },
  {
    id: "2",
    type: "outgoing",
    bookTitle: "The Art of Computer Programming Vol. 4",
    partnerLibrary: "University Library",
    requestDate: "2024-12-05",
    status: "shipped",
    patronName: "Emma Wilson",
  },
  {
    id: "3",
    type: "incoming",
    bookTitle: "Clean Architecture",
    partnerLibrary: "Metro Area Library Network",
    requestDate: "2024-12-03",
    status: "approved",
    dueDate: "2024-12-31",
  },
]

const partnerLibraries = [
  "Central Public Library",
  "University Library",
  "Metro Area Library Network",
  "Regional Academic Library",
  "State Library System",
]

export default function ILLPage() {
  const [requests, setRequests] = useState<ILLRequest[]>(mockILLRequests)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    bookTitle: "",
    isbn: "",
    partnerLibrary: "",
    patronName: "",
    notes: "",
  })

  const outgoingRequests = requests.filter((r) => r.type === "outgoing")
  const incomingRequests = requests.filter((r) => r.type === "incoming")

  const statusColors = {
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    received: "bg-green-100 text-green-800",
    returned: "bg-gray-100 text-gray-800",
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: ILLRequest = {
      id: String(Date.now()),
      type: "outgoing",
      bookTitle: newRequest.bookTitle,
      isbn: newRequest.isbn,
      partnerLibrary: newRequest.partnerLibrary,
      requestDate: new Date().toISOString().split("T")[0],
      status: "requested",
      patronName: newRequest.patronName,
      notes: newRequest.notes,
    }
    setRequests([newItem, ...requests])
    setIsRequestDialogOpen(false)
    setNewRequest({ bookTitle: "", isbn: "", partnerLibrary: "", patronName: "", notes: "" })
    toast.success("ILL request submitted")
  }

  const handleStatusChange = (id: string, newStatus: ILLRequest["status"]) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    toast.success(`Status updated to ${newStatus}`)
  }

  const RequestTable = ({ items, type }: { items: ILLRequest[]; type: "outgoing" | "incoming" }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Book</TableHead>
          <TableHead>Partner Library</TableHead>
          {type === "outgoing" && <TableHead>Patron</TableHead>}
          <TableHead>Request Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items
          .filter(
            (r) =>
              r.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.partnerLibrary.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((req) => (
            <TableRow key={req.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{req.bookTitle}</p>
                  {req.isbn && <p className="text-sm text-muted-foreground">{req.isbn}</p>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {req.partnerLibrary}
                </div>
              </TableCell>
              {type === "outgoing" && <TableCell>{req.patronName || "-"}</TableCell>}
              <TableCell className="text-muted-foreground">{new Date(req.requestDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-muted-foreground">
                {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : "-"}
              </TableCell>
              <TableCell>
                <Badge className={cn("capitalize", statusColors[req.status])}>{req.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {req.status === "requested" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, "approved")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Approved
                      </DropdownMenuItem>
                    )}
                    {req.status === "approved" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, "shipped")}>
                        Mark as Shipped
                      </DropdownMenuItem>
                    )}
                    {req.status === "shipped" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, "received")}>
                        Mark as Received
                      </DropdownMenuItem>
                    )}
                    {req.status === "received" && (
                      <DropdownMenuItem onClick={() => handleStatusChange(req.id, "returned")}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Mark as Returned
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="min-h-screen">
      <Header title="Interlibrary Loans" subtitle="Manage loans between partner libraries" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outgoingRequests.filter((r) => r.status !== "returned").length}</p>
                <p className="text-sm text-muted-foreground">Outgoing Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incomingRequests.filter((r) => r.status !== "returned").length}</p>
                <p className="text-sm text-muted-foreground">Incoming Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "requested").length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partnerLibraries.length}</p>
                <p className="text-sm text-muted-foreground">Partner Libraries</p>
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
                  placeholder="Search by book or library..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsRequestDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New ILL Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="outgoing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="outgoing" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Outgoing ({outgoingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Incoming ({incomingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outgoing">
            <div className="rounded-lg border bg-card">
              <RequestTable items={outgoingRequests} type="outgoing" />
            </div>
          </TabsContent>

          <TabsContent value="incoming">
            <div className="rounded-lg border bg-card">
              <RequestTable items={incomingRequests} type="incoming" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              New Interlibrary Loan Request
            </DialogTitle>
            <DialogDescription>Request a book from a partner library</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bookTitle">Book Title *</Label>
                <Input
                  id="bookTitle"
                  value={newRequest.bookTitle}
                  onChange={(e) => setNewRequest({ ...newRequest, bookTitle: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={newRequest.isbn}
                    onChange={(e) => setNewRequest({ ...newRequest, isbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patronName">Patron Name</Label>
                  <Input
                    id="patronName"
                    value={newRequest.patronName}
                    onChange={(e) => setNewRequest({ ...newRequest, patronName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerLibrary">Partner Library *</Label>
                <Select
                  value={newRequest.partnerLibrary}
                  onValueChange={(value) => setNewRequest({ ...newRequest, partnerLibrary: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select library" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerLibraries.map((lib) => (
                      <SelectItem key={lib} value={lib}>
                        {lib}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  placeholder="Any additional information..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
