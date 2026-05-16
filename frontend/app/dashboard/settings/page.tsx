"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Settings, Shield, Database, DollarSign, Save, Library, TrendingUp, Plus, AlertTriangle, Plug } from "lucide-react"
import { toast } from "sonner"
import { FeeStructureEditor } from "@/components/fee-structure-editor"
import { IntegrationConfigDialog } from "@/components/integration-config-dialog"
import type { FeeStructure, Budget, IntegrationConfig } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/circulation-utils"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(["admin"])

  const [librarySettings, setLibrarySettings] = useState({
    name: "LibraryHub Central",
    address: "123 Library Lane, Booktown, BK 12345",
    phone: "(555) 123-4567",
    email: "contact@libraryhub.com",
    website: "www.libraryhub.com",
  })

  const [circulationSettings, setCirculationSettings] = useState({
    loanPeriod: "14",
    maxRenewals: "2",
    maxBooksPatron: "5",
    maxBooksStaff: "15",
    finePerDay: "0.50",
    maxFine: "25.00",
  })

  const [rolePolicies, setRolePolicies] = useState({
    patron: { loanPeriod: 14, maxBooks: 5 },
    librarian: { loanPeriod: 21, maxBooks: 15 },
    admin: { loanPeriod: 30, maxBooks: 20 },
  })

  const [systemSettings, setSystemSettings] = useState({
    enableReservations: true,
    enableFines: true,
    enableEmailNotifications: true,
    autoRenewal: false,
    darkMode: false,
  })

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([
    {
      id: "1",
      type: "overdue",
      name: "Standard Overdue Fee",
      rate: 0.5,
      rateType: "per_day",
      maxAmount: 25.0,
      isActive: true,
    },
    {
      id: "2",
      type: "lost",
      name: "Lost Book Replacement",
      rate: 50.0,
      rateType: "fixed",
      isActive: true,
    },
    {
      id: "3",
      type: "damaged",
      name: "Damaged Book Fee",
      rate: 20.0,
      rateType: "fixed",
      isActive: true,
    },
  ])

  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: "1",
      name: "2024 Annual Budget",
      totalAmount: 50000,
      spentAmount: 32450,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      isActive: true,
    },
    {
      id: "2",
      name: "Fiction Category Budget",
      category: "Fiction",
      totalAmount: 15000,
      spentAmount: 11200,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      isActive: true,
    },
  ])

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([
    {
      id: "1",
      name: "Stripe Payment Gateway",
      type: "payment_gateway",
      provider: "Stripe",
      apiKey: "sk_test_***",
      endpoint: "https://api.stripe.com",
      isActive: true,
    },
    {
      id: "2",
      name: "Open Library API",
      type: "bibliographic_api",
      provider: "Open Library",
      apiKey: "",
      endpoint: "https://openlibrary.org",
      isActive: true,
    },
  ])
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null)

  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Settings" subtitle="System configuration and preferences" />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Access Restricted</h3>
              <p className="mt-2 text-sm text-muted-foreground">Only administrators can access system settings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="System configuration and preferences" />

      <div className="p-6">
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
            <TabsTrigger value="library" className="gap-2">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="circulation" className="gap-2">
              <Settings className="h-4 w-4" />
              Circulation
            </TabsTrigger>
            <TabsTrigger value="fines" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Fines
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Library Settings */}
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Library Information</CardTitle>
                <CardDescription>Basic information about your library</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="libName">Library Name</Label>
                    <Input
                      id="libName"
                      value={librarySettings.name}
                      onChange={(e) => setLibrarySettings({ ...librarySettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="libPhone">Phone</Label>
                    <Input
                      id="libPhone"
                      value={librarySettings.phone}
                      onChange={(e) => setLibrarySettings({ ...librarySettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="libAddress">Address</Label>
                  <Input
                    id="libAddress"
                    value={librarySettings.address}
                    onChange={(e) => setLibrarySettings({ ...librarySettings, address: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="libEmail">Email</Label>
                    <Input
                      id="libEmail"
                      type="email"
                      value={librarySettings.email}
                      onChange={(e) => setLibrarySettings({ ...librarySettings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="libWebsite">Website</Label>
                    <Input
                      id="libWebsite"
                      value={librarySettings.website}
                      onChange={(e) => setLibrarySettings({ ...librarySettings, website: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Circulation Settings */}
          <TabsContent value="circulation">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Circulation Rules</CardTitle>
                  <CardDescription>General borrowing limits and loan periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="loanPeriod">Default Loan Period (days)</Label>
                      <Select
                        value={circulationSettings.loanPeriod}
                        onValueChange={(value) => setCirculationSettings({ ...circulationSettings, loanPeriod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="21">21 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxRenewals">Maximum Renewals</Label>
                      <Select
                        value={circulationSettings.maxRenewals}
                        onValueChange={(value) => setCirculationSettings({ ...circulationSettings, maxRenewals: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No renewals</SelectItem>
                          <SelectItem value="1">1 renewal</SelectItem>
                          <SelectItem value="2">2 renewals</SelectItem>
                          <SelectItem value="3">3 renewals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Policies</CardTitle>
                  <CardDescription>Configure loan periods and borrowing limits by user role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patron Policy */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Patron</Label>
                        <p className="text-sm text-muted-foreground">Regular library members</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="patron-loan-period">Loan Period (days)</Label>
                        <Input
                          id="patron-loan-period"
                          type="number"
                          min="1"
                          value={rolePolicies.patron.loanPeriod}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              patron: { ...rolePolicies.patron, loanPeriod: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patron-max-books">Max Books</Label>
                        <Input
                          id="patron-max-books"
                          type="number"
                          min="1"
                          value={rolePolicies.patron.maxBooks}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              patron: { ...rolePolicies.patron, maxBooks: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Librarian Policy */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Librarian</Label>
                        <p className="text-sm text-muted-foreground">Library staff members</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="librarian-loan-period">Loan Period (days)</Label>
                        <Input
                          id="librarian-loan-period"
                          type="number"
                          min="1"
                          value={rolePolicies.librarian.loanPeriod}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              librarian: { ...rolePolicies.librarian, loanPeriod: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="librarian-max-books">Max Books</Label>
                        <Input
                          id="librarian-max-books"
                          type="number"
                          min="1"
                          value={rolePolicies.librarian.maxBooks}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              librarian: { ...rolePolicies.librarian, maxBooks: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Policy */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Admin</Label>
                        <p className="text-sm text-muted-foreground">Administrative users</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="admin-loan-period">Loan Period (days)</Label>
                        <Input
                          id="admin-loan-period"
                          type="number"
                          min="1"
                          value={rolePolicies.admin.loanPeriod}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              admin: { ...rolePolicies.admin, loanPeriod: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-max-books">Max Books</Label>
                        <Input
                          id="admin-max-books"
                          type="number"
                          min="1"
                          value={rolePolicies.admin.maxBooks}
                          onChange={(e) =>
                            setRolePolicies({
                              ...rolePolicies,
                              admin: { ...rolePolicies.admin, maxBooks: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fine Settings */}
          <TabsContent value="fines">
            <FeeStructureEditor feeStructures={feeStructures} onSave={setFeeStructures} />
          </TabsContent>

          {/* Budget Settings */}
          <TabsContent value="budget">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Budget Management
                  </CardTitle>
                  <CardDescription>Configure and track library acquisition budgets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {budgets.map((budget) => {
                    const spentPercentage = (budget.spentAmount / budget.totalAmount) * 100
                    const remaining = budget.totalAmount - budget.spentAmount
                    const isWarning = spentPercentage >= 80
                    const isCritical = spentPercentage >= 95

                    return (
                      <Card key={budget.id} className={cn(isCritical && "border-destructive/50")}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{budget.name}</CardTitle>
                              <CardDescription>
                                {budget.category ? `Category: ${budget.category}` : "Overall Budget"}
                              </CardDescription>
                            </div>
                            <Badge variant={budget.isActive ? "default" : "secondary"}>
                              {budget.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <Label className="text-muted-foreground">Total Budget</Label>
                              <p className="text-2xl font-bold">{formatCurrency(budget.totalAmount)}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Spent</Label>
                              <p className={cn("text-2xl font-bold", isWarning && "text-amber-600", isCritical && "text-destructive")}>
                                {formatCurrency(budget.spentAmount)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Remaining</Label>
                              <p className={cn("text-2xl font-bold", remaining < 0 && "text-destructive")}>
                                {formatCurrency(remaining)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Budget Usage</span>
                              <span className={cn("font-medium", isWarning && "text-amber-600", isCritical && "text-destructive")}>
                                {spentPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={spentPercentage}
                              className={cn(
                                "h-3",
                                isCritical && "bg-destructive/20",
                                isWarning && !isCritical && "bg-amber-500/20",
                              )}
                            />
                            {isCritical && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Budget limit nearly reached!
                              </p>
                            )}
                            {isWarning && !isCritical && (
                              <p className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Approaching budget limit
                              </p>
                            )}
                          </div>

                          <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Period:</span>
                              <span>
                                {new Date(budget.startDate).toLocaleDateString()} -{" "}
                                {new Date(budget.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  <Button onClick={() => toast.info("Add budget functionality coming soon")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Budget
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plug className="h-5 w-5" />
                      System Integrations
                    </CardTitle>
                    <CardDescription>Configure external system connections and APIs</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingIntegration(null)
                    setIsIntegrationDialogOpen(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Integration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <Card key={integration.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{integration.name}</h4>
                              <Badge variant={integration.isActive ? "default" : "secondary"}>
                                {integration.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Type: {integration.type.replace("_", " ")}</p>
                              <p>Provider: {integration.provider}</p>
                              {integration.endpoint && <p>Endpoint: {integration.endpoint}</p>}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingIntegration(integration)
                              setIsIntegrationDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {integrations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No integrations configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>General system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Enable Reservations</Label>
                    <p className="text-sm text-muted-foreground">Allow patrons to reserve unavailable books</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableReservations}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableReservations: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send automatic email alerts for due dates and holds</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableEmailNotifications}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, enableEmailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Auto-Renewal</Label>
                    <p className="text-sm text-muted-foreground">Automatically renew books if no holds exist</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoRenewal}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoRenewal: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme for the admin interface</p>
                  </div>
                  <Switch
                    checked={systemSettings.darkMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, darkMode: checked })}
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Integration Config Dialog */}
      <IntegrationConfigDialog
        open={isIntegrationDialogOpen}
        onOpenChange={(open) => {
          setIsIntegrationDialogOpen(open)
          if (!open) setEditingIntegration(null)
        }}
        integration={editingIntegration}
        onSave={(config) => {
          if (editingIntegration) {
            setIntegrations(integrations.map((i) => (i.id === config.id ? config : i)))
          } else {
            setIntegrations([...integrations, config])
          }
        }}
      />
    </div>
  )
}
