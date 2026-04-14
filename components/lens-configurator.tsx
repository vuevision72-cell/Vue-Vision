
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ChevronLeft } from "lucide-react";
import type { Product, LensOption, LensAddon } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useRouter } from "next/navigation";


export default function LensConfigurator({ product }: { product: Product }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { addItem } = useCart();
    const { profile } = useUserProfile([]);

    const handleAddToCart = async () => {
        if (!profile) {
            router.push('/login');
            return;
        }

        await addItem(product.id, 1, {});

        toast({
          title: "Added to Cart!",
          description: `${product.name} has been added.`,
        });
        setOpen(false);
      };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-full md:w-auto">
          Customise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center">
            Configure Your Lenses
          </DialogTitle>
          <DialogDescription>
            Selected Frame: {product.name}
          </DialogDescription>
        </DialogHeader>
        <p>Configuration options will be available soon.</p>
        <Button onClick={handleAddToCart}>Add to Cart</Button>

      </DialogContent>
    </Dialog>
  );
}
