// Membership expiry utilities

export function isMembershipExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

export function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getExpiryWarningLevel(expiryDate?: string): "none" | "warning" | "critical" | "expired" {
  if (!expiryDate) return "none"
  
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
  if (daysUntilExpiry === null) return "none"
  
  if (daysUntilExpiry < 0) return "expired"
  if (daysUntilExpiry <= 7) return "critical"
  if (daysUntilExpiry <= 30) return "warning"
  return "none"
}

export function formatExpiryDate(expiryDate?: string): string {
  if (!expiryDate) return "No expiry"
  return new Date(expiryDate).toLocaleDateString()
}


