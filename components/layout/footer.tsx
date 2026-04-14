
import Link from "next/link";
import { Instagram, Facebook, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-bold font-headline text-xl">
                ZENO PURE VISION
            </h2>
            <p className="text-primary-foreground/80 text-sm max-w-md">
              ZENO PURE VISION (Earlier known as ZENO PURE VISION) is a technology-driven eyewear company, with a belief that clear vision is fundamental to personal development and well-being. Our aim is to build tech-enabled supply and distribution solutions that improve access to affordable and quality Eyewear for All. We sell a wide range of eyewear products including prescription eyeglasses, sunglasses, and other products such as contact lenses and eyewear accessories. Our brands are designed to be aspirational and appeal to a wide range of customer segments.
            </p>
          </div>

          <div>
            <h3 className="font-headline text-md font-semibold mb-4">About Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-primary-foreground/80 hover:text-primary-foreground">
                  About Us
                </Link>
              </li>
               <li>
                <Link href="/help" className="text-primary-foreground/80 hover:text-primary-foreground">
                  Help
                </Link>
              </li>
               <li>
                <Link href="/blog" className="text-primary-foreground/80 hover:text-primary-foreground">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-headline text-md font-semibold mb-4">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tnc" className="text-primary-foreground/80 hover:text-primary-foreground">
                  T&C
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground">
                  Privacy & Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-primary-foreground/80 hover:text-primary-foreground">
                  Disclaimer
                </Link>
              </li>
               <li>
                <Link href="/returns-policy" className="text-primary-foreground/80 hover:text-primary-foreground">
                  Return & Refund Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline text-md font-semibold mb-4">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <Link href="https://www.linkedin.com/in/tarun-gupta-28125139a" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                <Linkedin className="h-6 w-6" />
              </Link>
              <Link href="https://www.instagram.com/zeno.pure.vision/?hl=en" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="https://www.facebook.com/profile.php?id=61581715148466" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://www.youtube.com/@ZenoPureVision" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                <Youtube className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/80">
          <p>&copy; {new Date().getFullYear()} Zeno Pure Vision. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
