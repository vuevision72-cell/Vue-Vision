
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

interface ScreenGlassPackage {
  id: number;
  name: string;
  price: number;
  features: string[];
  addons: { name: string; price: number }[];
}

interface ScreenGlassesConfiguratorProps {
  product: Product;
}

export default function ScreenGlassesConfigurator({ product }: ScreenGlassesConfiguratorProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { profile } = useUserProfile([]);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [packages, setPackages] = useState<ScreenGlassPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ScreenGlassPackage | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<{ name: string; price: number } | null>(null);

  const resetState = () => {
    setStep(1);
    setIsLoadingData(false);
    setIsSubmitting(false);
    setPackages([]);
    setSelectedPackage(null);
    setSelectedAddon(null);
  };

  const handleOpen = async () => {
    if (!profile) {
      localStorage.setItem('redirectPath', window.location.pathname);
      router.push('/login');
      return;
    }
    setOpen(true);
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from('screen_glasses_packages').select('*');
      if (error) throw error;
      setPackages(data || []);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load lens packages. Please try again.',
      });
      setOpen(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(resetState, 300);
    }
  };
  
  const handlePackageSelect = (pkg: ScreenGlassPackage) => {
    setSelectedPackage(pkg);
    const hasAddons = pkg.addons && pkg.addons.length > 0;
    setStep(hasAddons ? 2 : 3);
  };

  const handleAddonSelect = (addonName: string) => {
    const addon = selectedPackage?.addons.find(a => a.name === addonName);
    setSelectedAddon(addon || null);
    setStep(3);
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const totalPrice = useMemo(() => {
    let total = product.price;
    if (selectedPackage) {
      total += Number(selectedPackage.price);
    }
    if (selectedAddon) {
      total += Number(selectedAddon.price);
    }
    return total;
  }, [product.price, selectedPackage, selectedAddon]);

  const handleAddToCart = async () => {
    if (!profile || !selectedPackage) return;
    setIsSubmitting(true);
    try {
      const lensConfig = {
        type: 'screen_glasses',
        package: selectedPackage.name,
        addons: selectedAddon ? [selectedAddon.name] : [],
        totalPrice: totalPrice,
      };
      await addItem(product.id.toString(), 1, lensConfig);
      toast({
        title: 'Added to cart!',
        description: `${product.name} with custom screen lenses.`,
      });
      handleOpenChange(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem adding the item to your cart.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (step) {
      case 1: // Select Package
        return (
          <div className="space-y-3">
            <h3 className="text-center font-headline text-xl">Choose a Package</h3>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  selectedPackage?.id === pkg.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'hover:border-muted-foreground/50'
                )}
                onClick={() => handlePackageSelect(pkg)}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-bold">{pkg.name}</h4>
                  <p className="font-semibold text-primary">₹{Number(pkg.price)}</p>
                </div>
                <ul className="mt-2 list-disc list-inside space-y-1 rounded-md bg-secondary p-2 text-xs text-muted-foreground">
                  {pkg.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 2: // Select Addons
        return (
          <div className="space-y-3">
            <h3 className="text-center font-headline text-xl">Select Add-on</h3>
            <RadioGroup onValueChange={handleAddonSelect} value={selectedAddon?.name}>
              {(selectedPackage?.addons || []).map((addon) => (
                <Label key={addon.name} htmlFor={`addon-${addon.name}`} className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer", {"ring-2 ring-primary border-primary": selectedAddon?.name === addon.name})}>
                    <RadioGroupItem value={addon.name} id={`addon-${addon.name}`} />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{addon.name}</span>
                            <span className="font-semibold text-primary">+₹{addon.price}</span>
                        </div>
                    </div>
                </Label>
              ))}
            </RadioGroup>
             <Button className="w-full mt-4" variant="outline" onClick={() => { setSelectedAddon(null); setStep(3); }}>
                Skip Add-ons
             </Button>
          </div>
        );
      case 3: // Summary
        return (
          <div className="space-y-4">
            <h3 className="text-center font-headline text-xl">Your Configuration</h3>
            <Card className="bg-secondary p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Frame: {product.name}</span>
                  <span>₹{product.price.toFixed(2)}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span>Lens: {selectedPackage.name}</span>
                    <span>₹{Number(selectedPackage.price).toFixed(2)}</span>
                  </div>
                )}
                {selectedAddon && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Add-on: {selectedAddon.name}</span>
                    <span>+ ₹{selectedAddon.price.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>
            <Button className="w-full" size="lg" onClick={handleAddToCart} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : 'Add to Cart'}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-full" onClick={handleOpen}>
          Customise Lenses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center font-headline text-2xl">
            {step > 1 && (
              <Button variant="ghost" size="icon" className="mr-2" onClick={handleGoBack}>
                <ChevronLeft />
              </Button>
            )}
            Configure Your Screen Lenses
          </DialogTitle>
          <DialogDescription>Selected Frame: {product.name}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-1">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
