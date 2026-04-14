'use client';
import { useUserProfile } from "@/hooks/use-user-profile";
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
import { LayoutDashboard, ShoppingBag, LifeBuoy, Eye, User, Power, Package, Menu, Contact, UploadCloud, List, Gift, Wallet, Ticket, Settings, Home, Newspaper } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function AdminDashboardSkeleton() {
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthorized, profile } = useUserProfile(['admin']);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const productLinks = [
    { href: "/admin/products/all", label: "All Products", icon: List },
    { href: "/admin/products/eyeglasses", label: "Eyeglasses" },
    { href: "/admin/products/sunglasses", label: "Sunglasses" },
    { href: "/admin/products/screen-glasses", label: "Screen Glasses" },
    { href: "/admin/products/contact-lenses", label: "Contact Lenses" },
  ];

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (!isAuthorized) {
    // The hook already handles redirection
    return null;
  }
  
  const sidebarMenuContent = (
    <>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link href="/admin/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Homepage Management">
              <Link href="/admin/homepage">
                <Home />
                <span>Homepage</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Package />
                  <span>Products</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-8 space-y-1 py-2">
                {productLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={`flex items-center gap-2 text-sm p-1.5 rounded-md ${pathname === link.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}>
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Orders">
              <Link href="/admin/orders">
                <ShoppingBag />
                <span>Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Blog Management">
              <Link href="/admin/blog">
                <Newspaper />
                <span>Blog</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Coupons">
              <Link href="/admin/coupons">
                <Ticket />
                <span>Coupons</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Lens Management">
              <Link href="/admin/lens-management">
                <Settings />
                <span>Lens Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Collapsible>
             <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet />
                    <span>Wallet & Rewards</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-8 space-y-1 py-2">
                   <Link href="/admin/referral-settings" className={`flex items-center gap-2 text-sm p-1.5 rounded-md ${pathname === '/admin/referral-settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}>
                      <Gift className="h-4 w-4" />
                      <span>Referral Settings</span>
                    </Link>
                    <Link href="/admin/wallet-settings" className={`flex items-center gap-2 text-sm p-1.5 rounded-md ${pathname === '/admin/wallet-settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}>
                      <Wallet className="h-4 w-4" />
                      <span>Cashback & COD</span>
                    </Link>
                </div>
              </CollapsibleContent>
          </Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Support Requests">
              <Link href="/admin/support">
                <LifeBuoy />
                <span>Support Requests</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Contact Info">
              <Link href="/admin/contact-info">
                <Contact />
                <span>Contact Info</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Website Uploads">
              <Link href="/admin/website-uploads">
                <UploadCloud />
                <span>Website Uploads</span>
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
              <span>{profile?.full_name || 'Admin'}</span>
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
              Zeno Admin
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
                   <SheetTitle className="sr-only">Admin Menu</SheetTitle>
                  <div className="border-b p-2">
                      <Link href="/" className="flex items-center gap-2 p-2">
                          <Eye className="size-6 text-primary" />
                          <h2 className="font-headline text-lg text-foreground">
                          Zeno Admin
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
