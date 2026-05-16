"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Library, BookOpen, Users, BarChart3, Loader2 } from "lucide-react"
import { toast } from "sonner"

function LoginPage() {
  const router = useRouter()
  const { login, register, isLoading } = useAuth()
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", confirmPassword: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(loginData.email, loginData.password)
    if (result.success) {
      toast.success("Welcome back!")
      router.push("/dashboard")
    } else {
      toast.error(result.error || "Login failed")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    const result = await register({
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
    })
    if (result.success) {
      toast.success("Account created successfully! Your registration is pending approval.")
      router.push("/dashboard")
    } else {
      toast.error(result.error || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004E66] via-[#007090] to-[#01A7C2]" />
        <div className="absolute inset-0 bg-[url('/library-books-pattern.jpg')] opacity-10" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="h-10 w-10 text-white" />
              <span className="text-2xl font-bold text-white">LibraryHub</span>
            </div>
          </nav>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-24">
            {/* Left side - Hero content */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Modern Library
                <span className="block text-[#A0E1EB]">Management</span>
              </h1>
              <p className="mt-6 text-lg text-white/80">
                Streamline your library operations with our comprehensive management system. From cataloging to
                circulation, member management to analytics.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <BookOpen className="h-6 w-6 text-[#A0E1EB]" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">10,000+</p>
                  <p className="text-xs text-white/60">Books Managed</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <Users className="h-6 w-6 text-[#A0E1EB]" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">5,000+</p>
                  <p className="text-xs text-white/60">Active Members</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <BarChart3 className="h-6 w-6 text-[#A0E1EB]" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">99.9%</p>
                  <p className="text-xs text-white/60">Uptime</p>
                </div>
              </div>
            </div>

            {/* Right side - Auth Card */}
            <div className="flex items-center justify-center lg:justify-end">
              <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Welcome</CardTitle>
                  <CardDescription>Sign in to your account or create a new one</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-6">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                          Demo: admin@library.com / password123
                        </p>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="mt-6">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">Full Name</Label>
                          <Input
                            id="register-name"
                            placeholder="John Doe"
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="your@email.com"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-confirm">Confirm Password</Label>
                          <Input
                            id="register-confirm"
                            type="password"
                            placeholder="Confirm your password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-card-foreground">Everything You Need</h2>
            <p className="mt-4 text-lg text-muted-foreground">A complete solution for modern library management</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Book Catalog",
                description: "Manage your entire collection with advanced search and filtering",
                icon: BookOpen,
              },
              {
                title: "Member Management",
                description: "Track memberships, borrowing history, and patron details",
                icon: Users,
              },
              {
                title: "Circulation",
                description: "Handle check-outs, returns, renewals, and reservations",
                icon: Library,
              },
              {
                title: "Analytics",
                description: "Get insights with reports on usage, trends, and more",
                icon: BarChart3,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-background p-6 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">LibraryHub</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Built with the MERN stack and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}
