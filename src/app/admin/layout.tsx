"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AdminNav } from "@/components/admin-nav"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (user.role !== "admin") {
        router.push("/")
      } else {
        setIsAdmin(true)
      }
    }
  }, [user, loading, router])

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r flex-col">
        <div className="p-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Social Dining</p>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>
        <div className="p-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            Logged in as {user?.email}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              logout()
              router.push("/")
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <h1 className="font-bold">Admin</h1>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg">Navigation</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AdminNav />
                </div>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      logout()
                      router.push("/")
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-16">
        {children}
      </main>
    </div>
  )
}
