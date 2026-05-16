"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Clock, Package, Building } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/circulation-utils"
import type { VendorQuote } from "@/lib/types"

interface VendorQuoteComparisonProps {
  acquisitionId: string
  quotes: VendorQuote[]
  onSelectQuote: (quoteId: string) => void
  onRequestQuote?: (vendorId: string) => void
}

export function VendorQuoteComparison({
  acquisitionId,
  quotes,
  onSelectQuote,
  onRequestQuote,
}: VendorQuoteComparisonProps) {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)

  const handleSelect = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
    onSelectQuote(quoteId)
  }

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (a.status === "accepted") return -1
    if (b.status === "accepted") return 1
    return a.price - b.price
  })

  const bestPrice = Math.min(...quotes.map((q) => q.price))
  const fastestDelivery = Math.min(...quotes.map((q) => q.deliveryDays))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vendor Quotes Comparison</h3>
          <p className="text-sm text-muted-foreground">{quotes.length} quote(s) received</p>
        </div>
        {onRequestQuote && (
          <Button variant="outline" onClick={() => onRequestQuote("")}>
            Request More Quotes
          </Button>
        )}
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No quotes received yet</p>
            {onRequestQuote && (
              <Button onClick={() => onRequestQuote("")}>Request Quotes from Vendors</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedQuotes.map((quote) => {
            const isBestPrice = quote.price === bestPrice
            const isFastestDelivery = quote.deliveryDays === fastestDelivery
            const isSelected = selectedQuoteId === quote.id || quote.status === "accepted"

            return (
              <Card
                key={quote.id}
                className={cn(
                  "transition-all",
                  isSelected && "ring-2 ring-primary",
                  quote.status === "accepted" && "bg-primary/5",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {quote.vendorName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Submitted: {new Date(quote.submittedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {quote.status === "accepted" && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                    {quote.status === "rejected" && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      {isBestPrice && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Best Price
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(quote.price)}</p>
                  </div>

                  {/* Delivery Time */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delivery Time</span>
                      {isFastestDelivery && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Fastest
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {quote.deliveryDays} days
                    </p>
                  </div>

                  {/* Terms */}
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Terms</span>
                    <p className="text-sm">{quote.terms || "Standard terms apply"}</p>
                  </div>

                  {/* Valid Until */}
                  <div className="rounded-lg bg-muted p-2 text-xs">
                    <span className="text-muted-foreground">Valid until: </span>
                    <span className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  {quote.status !== "accepted" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelect(quote.id)}
                        variant={isSelected ? "default" : "outline"}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          "Select Quote"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Comparison Table */}
      {quotes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
            <CardDescription>Compare all quotes at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Delivery (days)</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuotes.map((quote) => {
                    const isBestPrice = quote.price === bestPrice
                    const isFastestDelivery = quote.deliveryDays === fastestDelivery

                    return (
                      <TableRow key={quote.id} className={cn(quote.status === "accepted" && "bg-primary/5")}>
                        <TableCell className="font-medium">{quote.vendorName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={cn(isBestPrice && "font-bold text-green-600")}>
                              {formatCurrency(quote.price)}
                            </span>
                            {isBestPrice && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                Best
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={cn(isFastestDelivery && "font-bold text-blue-600")}>
                              {quote.deliveryDays}
                            </span>
                            {isFastestDelivery && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Fastest
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{quote.terms}</TableCell>
                        <TableCell>{new Date(quote.validUntil).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              quote.status === "accepted"
                                ? "default"
                                : quote.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {quote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quote.status !== "accepted" && (
                            <Button size="sm" variant="outline" onClick={() => handleSelect(quote.id)}>
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


