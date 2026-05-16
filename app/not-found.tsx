import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookX, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAEBED] via-white to-[#A0E1EB]/20 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#004E66] to-[#007090]">
          <BookX className="h-12 w-12 text-white" />
        </div>

        <h1 className="text-6xl font-bold text-[#004E66] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#007090] mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved. It might have been checked out by another
          user!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#004E66] hover:bg-[#007090]">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
