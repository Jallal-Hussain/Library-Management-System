import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function MyBooksLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-card px-6 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
