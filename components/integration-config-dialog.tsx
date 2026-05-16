"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Key, Globe, Database, Building2, TestTube } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { IntegrationConfig } from "@/lib/types"
import { toast } from "sonner"

interface IntegrationConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration?: IntegrationConfig | null
  onSave: (config: IntegrationConfig) => void
}

const integrationTypes = [
  { value: "payment_gateway", label: "Payment Gateway", icon: Key },
  { value: "student_db", label: "Student Database", icon: Database },
  { value: "bibliographic_api", label: "Bibliographic API", icon: Globe },
  { value: "ill_api", label: "ILL API", icon: Building2 },
]

const providers = {
  payment_gateway: ["Stripe", "PayPal", "Square", "Custom"],
  student_db: ["Banner", "PeopleSoft", "Custom SQL", "REST API"],
  bibliographic_api: ["Open Library", "WorldCat", "Google Books", "Custom"],
  ill_api: ["OCLC", "Relais", "Custom"],
}

export function IntegrationConfigDialog({
  open,
  onOpenChange,
  integration,
  onSave,
}: IntegrationConfigDialogProps) {
  const [formData, setFormData] = useState<Partial<IntegrationConfig>>(
    integration || {
      name: "",
      type: "payment_gateway",
      provider: "",
      apiKey: "",
      apiSecret: "",
      endpoint: "",
      isActive: false,
      config: {},
    },
  )
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    // Simulate API connection test
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock test result
    const success = formData.apiKey && formData.endpoint
    setTestResult(success ? "success" : "error")
    setIsTesting(false)

    if (success) {
      toast.success("Connection test successful!")
    } else {
      toast.error("Connection test failed. Please check your credentials.")
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.provider) {
      toast.error("Please fill in all required fields")
      return
    }

    const config: IntegrationConfig = {
      id: integration?.id || String(Date.now()),
      name: formData.name,
      type: formData.type as IntegrationConfig["type"],
      provider: formData.provider,
      apiKey: formData.apiKey,
      apiSecret: formData.apiSecret,
      endpoint: formData.endpoint,
      isActive: formData.isActive || false,
      config: formData.config || {},
    }

    onSave(config)
    toast.success("Integration configuration saved")
    onOpenChange(false)
  }

  const selectedType = integrationTypes.find((t) => t.value === formData.type)
  const TypeIcon = selectedType?.icon || Key

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            {integration ? "Edit Integration" : "Add Integration"}
          </DialogTitle>
          <DialogDescription>Configure external system integration settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Stripe Payment Gateway"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Integration Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: IntegrationConfig["type"]) => setFormData({ ...formData, type: value, provider: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type &&
                    providers[formData.type as keyof typeof providers]?.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* API Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">API Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://api.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  placeholder="Enter API secret"
                />
              </div>
            </div>

            {/* Connection Test */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.apiKey || !formData.endpoint}
              >
                <TestTube className="mr-2 h-4 w-4" />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              {testResult === "success" && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Connection successful!</AlertDescription>
                </Alert>
              )}
              {testResult === "error" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>Connection failed. Please check your credentials.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">Enable this integration</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


