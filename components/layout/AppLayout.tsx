
'use client';
import { usePathname } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAccountOrAdminPage = pathname.startsWith('/account') || pathname.startsWith('/admin');

    if (isAccountOrAdminPage) {
        return <main>{children}</main>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <WhatsAppIcon />
        </div>
    )
}
