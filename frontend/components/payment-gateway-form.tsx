"use client"

import { useState } from "react"
import { CreditCard, DollarSign, Receipt, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { formatCurrency, CURRENCY_RATE_PKR } from "@/lib/circulation-utils"

interface PaymentGatewayFormProps {
  amount: number
  onPaymentComplete: (paymentData: {
    amount: number
    method: "card" | "cash" | "check" | "transfer"
    receiptNumber: string
  }) => void
  onCancel?: () => void
}

export function PaymentGatewayForm({ amount, onPaymentComplete, onCancel }: PaymentGatewayFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "check" | "transfer">("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCVC, setCardCVC] = useState("")
  const [cardName, setCardName] = useState("")
  const [checkNumber, setCheckNumber] = useState("")
  const [transferReference, setTransferReference] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const generateReceiptNumber = () => {
    return `REC-${Date.now().toString().slice(-8)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Validate based on payment method
    if (paymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
        toast.error("Please fill in all card details")
        setIsProcessing(false)
        return
      }
      // Basic card number validation (should be 16 digits)
      const cleanCardNumber = cardNumber.replace(/\s/g, "")
      if (cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
        toast.error("Please enter a valid 16-digit card number")
        setIsProcessing(false)
        return
      }
    } else if (paymentMethod === "check") {
      if (!checkNumber) {
        toast.error("Please enter check number")
        setIsProcessing(false)
        return
      }
    } else if (paymentMethod === "transfer") {
      if (!transferReference) {
        toast.error("Please enter transfer reference")
        setIsProcessing(false)
        return
      }
    }

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const receiptNumber = generateReceiptNumber()
    const amountPKR = amount * CURRENCY_RATE_PKR
    toast.success(`Payment of ${formatCurrency(amount)} processed successfully!`)
    onPaymentComplete({
      amount: amountPKR,
      method: paymentMethod,
      receiptNumber,
    })
    setIsProcessing(false)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
    return formatted.slice(0, 19) // Max 16 digits + 3 spaces
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold">{formatCurrency(amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Select your preferred payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={paymentMethod} onValueChange={(value: typeof paymentMethod) => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit/Debit Card
                </div>
              </SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Payment Details */}
      {paymentMethod === "card" && (
        <Card>
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
            <CardDescription>Enter your card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCVC">CVC</Label>
                <Input
                  id="cardCVC"
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>🔒 Your payment information is secure and encrypted</p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "check" && (
        <Card>
          <CardHeader>
            <CardTitle>Check Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Enter check number"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "transfer" && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="transferReference">Transfer Reference</Label>
              <Input
                id="transferReference"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Enter transfer reference number"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === "cash" && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Receipt className="h-5 w-5" />
              <p>Please provide cash payment at the circulation desk</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isProcessing} className="flex-1">
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Process Payment {formatCurrency(amount)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}


