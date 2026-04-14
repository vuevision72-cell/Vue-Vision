
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  className?: string;
}

export default function FeatureCard({ title, subtitle, imageUrl, href, className }: FeatureCardProps) {
  return (
    <Link href={href} className={cn("group block relative aspect-square w-full overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300", className)}>
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-bold text-lg drop-shadow-md">{title}</h3>
        <p className="text-sm opacity-90 drop-shadow-sm">{subtitle}</p>
      </div>
    </Link>
  );
}
