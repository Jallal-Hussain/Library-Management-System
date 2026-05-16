"use client"

import { useState } from "react"
import { Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FeeStructure, FeeType } from "@/lib/types"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/circulation-utils"

interface FeeStructureEditorProps {
  feeStructures: FeeStructure[]
  onSave: (structures: FeeStructure[]) => void
}

export function FeeStructureEditor({ feeStructures, onSave }: FeeStructureEditorProps) {
  const [structures, setStructures] = useState<FeeStructure[]>(feeStructures)

  const feeTypeLabels: Record<FeeType, string> = {
    overdue: "Overdue",
    lost: "Lost Book",
    damaged: "Damaged Book",
    processing: "Processing Fee",
  }

  const rateTypeLabels = {
    per_day: "Per Day",
    fixed: "Fixed Amount",
    percentage: "Percentage",
  }

  const handleAdd = () => {
    const newStructure: FeeStructure = {
      id: String(Date.now()),
      type: "overdue",
      name: "",
      rate: 0,
      rateType: "per_day",
      isActive: true,
    }
    setStructures([...structures, newStructure])
  }

  const handleUpdate = (id: string, updates: Partial<FeeStructure>) => {
    setStructures(structures.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const handleDelete = (id: string) => {
    setStructures(structures.filter((s) => s.id !== id))
    toast.success("Fee structure removed")
  }

  const handleSave = () => {
    // Validate
    for (const structure of structures) {
      if (!structure.name.trim()) {
        toast.error("Please provide a name for all fee structures")
        return
      }
      if (structure.rate <= 0) {
        toast.error("Rate must be greater than 0")
        return
      }
    }
    onSave(structures)
    toast.success("Fee structures saved successfully")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fee Structures</h3>
          <p className="text-sm text-muted-foreground">Configure different types of fees and their rates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Type
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {structures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No fee structures configured</p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Fee Structure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {structures.map((structure) => (
            <Card key={structure.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {structure.name || `New ${feeTypeLabels[structure.type]}`}
                    </CardTitle>
                    <CardDescription>{feeTypeLabels[structure.type]}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${structure.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${structure.id}`}
                        checked={structure.isActive}
                        onCheckedChange={(checked) => handleUpdate(structure.id, { isActive: checked })}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(structure.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${structure.id}`}>Fee Name *</Label>
                    <Input
                      id={`name-${structure.id}`}
                      value={structure.name}
                      onChange={(e) => handleUpdate(structure.id, { name: e.target.value })}
                      placeholder="e.g., Standard Overdue Fee"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`type-${structure.id}`}>Fee Type *</Label>
                    <Select
                      value={structure.type}
                      onValueChange={(value: FeeType) => handleUpdate(structure.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="lost">Lost Book</SelectItem>
                        <SelectItem value="damaged">Damaged Book</SelectItem>
                        <SelectItem value="processing">Processing Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`rateType-${structure.id}`}>Rate Type *</Label>
                    <Select
                      value={structure.rateType}
                      onValueChange={(value: "per_day" | "fixed" | "percentage") =>
                        handleUpdate(structure.id, { rateType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`rate-${structure.id}`}>
                      Rate * {structure.rateType === "percentage" && "(%)"}
                    </Label>
                    <Input
                      id={`rate-${structure.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={structure.rate}
                      onChange={(e) => handleUpdate(structure.id, { rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`maxAmount-${structure.id}`}>Max Amount (Optional)</Label>
                    <Input
                      id={`maxAmount-${structure.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={structure.maxAmount || ""}
                      onChange={(e) =>
                        handleUpdate(structure.id, { maxAmount: e.target.value ? Number(e.target.value) : undefined })
                      }
                      placeholder="No limit"
                    />
                  </div>
                </div>

                {structure.rateType === "per_day" && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium">Example Calculation:</p>
                    <p className="text-muted-foreground">
                      If a book is 5 days overdue: {formatCurrency(structure.rate)} × 5 ={" "}
                      {formatCurrency(structure.rate * 5)}
                      {structure.maxAmount && ` (max: ${formatCurrency(structure.maxAmount)})`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


