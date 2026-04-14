
'use client';
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, User, Power, Eye, Menu, Gift, Wallet } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
        <div className="hidden w-64 bg-gray-200 p-4 md:block">
            <Skeleton className="h-10 w-32 mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="flex-1 p-8">
            <div className="md:hidden mb-4">
                 <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-12 w-1/4 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    </div>
  );
}


export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthorized, profile } = useUserProfile(['student', 'admin']);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthorized) {
    // The hook will have already initiated a redirect, so you can return null or a loader.
    return null;
  }
  
  const sidebarMenuContent = (
     <>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link href="/account/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Orders">
              <Link href="/account/orders">
                <ShoppingBag />
                <span>My Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Wallet">
              <Link href="/account/wallet">
                <Wallet />
                <span>My Wallet</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Refer & Earn">
              <Link href="/account/referrals">
                <Gift />
                <span>Refer & Earn</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Account">
              <User />
              <span>{profile?.full_name || 'User'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <Power />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 p-2">
            <Eye className="size-6 text-primary" />
            <h2 className="font-headline text-lg text-sidebar-foreground">
              Zeno Pure Vision
            </h2>
            <div className="grow" />
            <SidebarTrigger />
          </Link>
        </SidebarHeader>
        {sidebarMenuContent}
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                 <SheetHeader>
                   <SheetTitle className="sr-only">Account Menu</SheetTitle>
                  <div className="border-b p-2">
                      <Link href="/" className="flex items-center gap-2 p-2">
                          <Eye className="size-6 text-primary" />
                          <h2 className="font-headline text-lg text-foreground">
                          Zeno Pure Vision
                          </h2>
                      </Link>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  {sidebarMenuContent}
                </div>
              </SheetContent>
            </Sheet>
        </header>
        <div className="min-h-screen bg-background p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
