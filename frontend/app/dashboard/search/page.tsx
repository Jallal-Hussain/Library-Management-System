"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { performSearch } from "@/lib/search-utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Users, ListChecks } from "lucide-react"
import Link from "next/link"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const results = useMemo(() => performSearch(query), [query])

  return (
    <div className="min-h-screen">
      <Header title="Search Results" subtitle="Find books, members, and transactions" />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <form action="/dashboard/search" method="get" className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={query} placeholder="Search across the library..." className="pl-9" />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Books */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Books
              </CardTitle>
              <CardDescription>Matching titles, authors, or keywords</CardDescription>
            </div>
            <Badge variant="outline">{results.books.length} found</Badge>
          </CardHeader>
          <CardContent>
            {results.books.length === 0 ? (
              <p className="text-sm text-muted-foreground">No books match this search.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/books/${book.id}`} className="hover:underline">
                          {book.title}
                        </Link>
                      </TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.category}</TableCell>
                      <TableCell className="space-x-1">
                        {book.keywords?.slice(0, 3).map((kw) => (
                          <Badge key={kw} variant="secondary">
                            {kw}
                          </Badge>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>Names or emails</CardDescription>
            </div>
            <Badge variant="outline">{results.members.length} found</Badge>
          </CardHeader>
          <CardContent>
            {results.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members match this search.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Transactions
              </CardTitle>
              <CardDescription>Loans, returns, and status</CardDescription>
            </div>
            <Badge variant="outline">{results.transactions.length} found</Badge>
          </CardHeader>
          <CardContent>
            {results.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions match this search.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.bookTitle}</TableCell>
                      <TableCell>{tx.userName}</TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.issueDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

