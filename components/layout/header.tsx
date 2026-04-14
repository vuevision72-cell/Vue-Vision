
'use client';

import Link from 'next/link';
import {
  Eye,
  Menu,
  ShoppingCart,
  User,
  Phone,
  LogIn,
  Power,
  LayoutDashboard,
  Search,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavLinks } from '@/lib/navigation';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useEffect, useState, useRef } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCart } from '@/hooks/use-cart';
import { Badge } from '../ui/badge';
import { GlobalSearch } from '../global-search';
import Autoplay from "embla-carousel-autoplay";


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useUserProfile([]);
  const { itemCount } = useCart();
  const [isClient, setIsClient] = useState(false);
  const [contactInfo, setContactInfo] = useState({ phone_number: '' });
  
  useEffect(() => {
    setIsClient(true);
    const fetchContact = async () => {
      const { data } = await supabase.from('contact_info').select('phone_number').single();
      if (data) setContactInfo(data);
    };
    fetchContact();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  const isSpecialPage = pathname === '/login' || pathname === '/signup';

  if (isSpecialPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className="hidden md:flex flex-col">
            <div className="flex h-20 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold font-headline text-3xl tracking-wider">ZENO</span>
                    </Link>
                    {contactInfo.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4"/>
                            <span>{contactInfo.phone_number}</span>
                        </div>
                    )}
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md">
                    <GlobalSearch />
                </div>

                <div className="flex items-center gap-4 text-sm font-medium">
                {!isLoading &&
                    (profile ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <span>My Account</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {profile.full_name || profile.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {profile.role === 'admin' ? (
                            <DropdownMenuItem asChild>
                            <Link href="/admin/dashboard">Admin Dashboard</Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem asChild>
                                <Link href="/account/dashboard">My Dashboard</Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <Power className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    ) : (
                    <Link
                        href="/login"
                        className="text-foreground hover:text-primary flex items-center gap-2"
                    >
                        <User className="h-5 w-5" />
                        <span>Sign In</span>
                    </Link>
                    ))}
                
                {profile && (
                    <Link
                        href="/account/wallet"
                        className="text-foreground hover:text-primary flex items-center gap-2"
                    >
                        <Wallet className="h-5 w-5" />
                        <span>Wallet</span>
                    </Link>
                )}

                <Link
                    href="/cart"
                    className="text-foreground hover:text-primary relative flex items-center gap-2"
                >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart</span>
                    {isClient && itemCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-3 h-5 w-5 justify-center p-0">{itemCount}</Badge>
                    )}
                </Link>
                </div>
            </div>
            <div className="h-12 flex items-center justify-center border-t">
                <nav className="flex items-center gap-8 text-sm font-medium">
                    {mainNavLinks.map(link =>
                    link.submenu ? (
                        <HoverCard key={link.label} openDelay={50} closeDelay={50}>
                        <HoverCardTrigger asChild>
                            <Link
                            href={link.href}
                            className={cn(
                                'flex items-center gap-1 transition-colors hover:text-primary',
                                pathname.startsWith(link.href)
                                ? 'text-primary font-semibold'
                                : 'text-foreground'
                            )}
                            >
                            {link.label}
                            </Link>
                        </HoverCardTrigger>
                        <HoverCardContent
                            className="w-screen max-w-4xl"
                            align="start"
                        >
                            <div className="grid grid-cols-4 gap-4 p-4">
                            {link.submenu.map(group => (
                                <div key={group.title} className="space-y-4">
                                <h4 className="font-semibold text-sm">
                                    {group.title}
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {group.items.map(item => (
                                    <Link
                                        href={item.href}
                                        key={item.label}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                    ))}
                                </div>
                                </div>
                            ))}
                            </div>
                        </HoverCardContent>
                        </HoverCard>
                    ) : (
                        <Link
                        key={link.href + link.label}
                        href={link.href}
                        className={cn(
                            'flex items-center gap-1 transition-colors hover:text-primary',
                            pathname === link.href
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        )}
                        >
                        {link.label}
                        </Link>
                    )
                    )}
                </nav>
            </div>
        </div>


        {/* Mobile Header */}
        <div className="md:hidden flex h-16 items-center justify-between">
            <div className="flex items-center gap-1">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="sr-only">Main Menu</SheetTitle>
                            <Link href="/" className="flex items-center space-x-2">
                                <span className="font-bold font-headline text-lg">ZENO</span>
                            </Link>
                        </SheetHeader>
                        <nav className="flex flex-col space-y-2 p-4">
                        {mainNavLinks.map(link => (
                            <SheetClose asChild key={link.href + link.label}>
                            <Link
                                href={link.href}
                                className={cn(
                                'text-lg font-medium p-2 rounded-md',
                                pathname === link.href
                                    ? 'text-primary bg-secondary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                )}
                            >
                                {link.label}
                            </Link>
                            </SheetClose>
                        ))}
                        <div className="border-t pt-4 mt-4 space-y-2">
                            {profile ? (
                            <>
                                <SheetClose asChild>
                                    <Link
                                    href={profile.role === 'admin' ? "/admin/dashboard" : "/account/dashboard"}
                                    className="flex items-center gap-3 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    >
                                    <LayoutDashboard className="h-5 w-5" />
                                    <span>Dashboard</span>
                                    </Link>
                                </SheetClose>
                                <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                                >
                                <Power className="h-5 w-5" />
                                <span>Sign Out</span>
                                </button>
                            </>
                            ) : (
                            <SheetClose asChild>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-3 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                                >
                                    <LogIn className="h-5 w-5" />
                                    <span>Sign In / Sign Up</span>
                                </Link>
                            </SheetClose>
                            )}
                            <SheetClose asChild>
                            <Link
                            href="/help"
                            className="flex items-center gap-3 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                            >
                            <Phone className="h-5 w-5" />
                            <span>Support</span>
                            </Link>
                            </SheetClose>
                        </div>
                        </nav>
                    </SheetContent>
                </Sheet>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Search className="h-6 w-6" />
                            <span className="sr-only">Search</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="top-1/4">
                        <DialogHeader>
                        <DialogTitle>Search Products</DialogTitle>
                        </DialogHeader>
                        <GlobalSearch />
                    </DialogContent>
                </Dialog>
            </div>

            <Link href="/" className="font-bold font-headline text-2xl absolute left-1/2 -translate-x-1/2">
                ZENO
            </Link>

            <div className="flex items-center gap-1">
                 <Button asChild variant="ghost" size="icon">
                    <Link href={profile ? "/account/wallet" : "/login"}>
                      <Wallet className="h-6 w-6" />
                      <span className="sr-only">Wallet</span>
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="icon">
                    <Link href="/cart" className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {isClient && itemCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{itemCount}</Badge>
                        )}
                        <span className="sr-only">Cart</span>
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </header>
  );
}
