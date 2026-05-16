"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, MoreHorizontal, Building2, Mail, Phone, Globe, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface Vendor {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  website?: string
  address: string
  status: "active" | "inactive"
  totalOrders: number
  notes?: string
}

const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "Penguin Random House",
    contactPerson: "Sarah Miller",
    email: "orders@penguinrandomhouse.com",
    phone: "1-800-733-3000",
    website: "https://www.penguinrandomhouse.com",
    address: "1745 Broadway, New York, NY 10019",
    status: "active",
    totalOrders: 45,
  },
  {
    id: "2",
    name: "HarperCollins Publishers",
    contactPerson: "John Davis",
    email: "library@harpercollins.com",
    phone: "1-800-242-7737",
    website: "https://www.harpercollins.com",
    address: "195 Broadway, New York, NY 10007",
    status: "active",
    totalOrders: 32,
  },
  {
    id: "3",
    name: "Simon & Schuster",
    contactPerson: "Emily Chen",
    email: "orders@simonandschuster.com",
    phone: "1-800-223-2336",
    address: "1230 Avenue of the Americas, New York, NY 10020",
    status: "active",
    totalOrders: 28,
  },
  {
    id: "4",
    name: "Local Book Distributors",
    contactPerson: "Mike Johnson",
    email: "mike@localbookdist.com",
    phone: "555-0199",
    address: "456 Commerce St, Local City, ST 12345",
    status: "inactive",
    totalOrders: 5,
    notes: "Small local distributor - use for regional titles",
  },
]

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    notes: "",
  })

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault()
    const vendor: Vendor = {
      id: String(Date.now()),
      ...newVendor,
      status: "active",
      totalOrders: 0,
    }
    setVendors([vendor, ...vendors])
    setIsAddDialogOpen(false)
    resetForm()
    toast.success("Vendor added successfully")
  }

  const handleEditVendor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVendor) return

    setVendors(vendors.map((v) => (v.id === selectedVendor.id ? { ...v, ...newVendor } : v)))
    setIsAddDialogOpen(false)
    setIsEditing(false)
    setSelectedVendor(null)
    resetForm()
    toast.success("Vendor updated successfully")
  }

  const handleDeleteVendor = () => {
    if (!selectedVendor) return
    setVendors(vendors.filter((v) => v.id !== selectedVendor.id))
    setIsDeleteDialogOpen(false)
    setSelectedVendor(null)
    toast.success("Vendor deleted")
  }

  const handleToggleStatus = (vendor: Vendor) => {
    setVendors(
      vendors.map((v) => (v.id === vendor.id ? { ...v, status: v.status === "active" ? "inactive" : "active" } : v)),
    )
    toast.success(`Vendor ${vendor.status === "active" ? "deactivated" : "activated"}`)
  }

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setNewVendor({
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website || "",
      address: vendor.address,
      notes: vendor.notes || "",
    })
    setIsEditing(true)
    setIsAddDialogOpen(true)
  }

  const resetForm = () => {
    setNewVendor({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      notes: "",
    })
  }

  return (
    <div className="min-h-screen">
      <Header title="Vendor Management" subtitle="Manage book suppliers and distributors" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-[#004E66]/10 p-3">
                <Building2 className="h-6 w-6 text-[#004E66]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.length}</p>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.filter((v) => v.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.reduce((acc, v) => acc + v.totalOrders, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
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
                  placeholder="Search vendors..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  resetForm()
                  setIsEditing(false)
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Vendor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-[#004E66]/10 p-2">
                        <Building2 className="h-4 w-4 text-[#004E66]" />
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#007090] hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${vendor.email}`}
                      className="text-[#007090] hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      {vendor.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {vendor.phone}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">{vendor.totalOrders}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        vendor.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
                      )}
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(vendor)}>
                          {vendor.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isEditing ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Update vendor information" : "Add a new book supplier or distributor"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditing ? handleEditVendor : handleAddVendor}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={newVendor.contactPerson}
                    onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={newVendor.website}
                    onChange={(e) => setNewVendor({ ...newVendor, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  placeholder="Additional information..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Add"} Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${selectedVendor?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        icon="delete"
        onConfirm={handleDeleteVendor}
      />
    </div>
  )
}
