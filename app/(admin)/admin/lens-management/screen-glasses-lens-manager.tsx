
'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ScreenGlassPackage {
  id: number;
  name: string;
  price: number;
  features: string[];
  addons: { name: string; price: number }[];
}

export function ScreenGlassesLensManager() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<ScreenGlassPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ScreenGlassPackage | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('screen_glasses_packages').select('*').order('id');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch screen glass packages.' });
    } else {
      setPackages(data || []);
    }
    setIsLoading(false);
  };

  const handleEditClick = (pkg: ScreenGlassPackage) => {
    setEditingPackage({ ...pkg });
    setIsDialogOpen(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingPackage) {
      setEditingPackage({ ...editingPackage, price: Number(e.target.value) });
    }
  };

  const handleAddonPriceChange = (addonName: string, newPrice: number) => {
    if (editingPackage) {
      const updatedAddons = editingPackage.addons.map(addon =>
        addon.name === addonName ? { ...addon, price: newPrice } : addon
      );
      setEditingPackage({ ...editingPackage, addons: updatedAddons });
    }
  };

  const handleSubmit = async () => {
    if (!editingPackage) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from('screen_glasses_packages')
      .update({ price: editingPackage.price, addons: editingPackage.addons })
      .eq('id', editingPackage.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update package.' });
    } else {
      toast({ title: 'Success', description: `${editingPackage.name} has been updated.` });
      setIsDialogOpen(false);
      fetchPackages();
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
    </div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {packages.map(pkg => (
          <Card key={pkg.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="font-semibold text-primary text-xl">₹{pkg.price}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(pkg)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </div>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside bg-secondary p-2 rounded-md">
                {pkg.features.map((feature, i) => <li key={i}>{feature}</li>)}
              </ul>
              {pkg.addons && pkg.addons.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">Add-ons:</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {pkg.addons.map(addon => (
                      <div key={addon.name} className="flex justify-between">
                        <span>{addon.name}</span>
                        <span>+ ₹{addon.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit: {editingPackage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base-price">Base Package Price (₹)</Label>
              <Input
                id="base-price"
                type="number"
                value={editingPackage?.price || 0}
                onChange={handlePriceChange}
              />
            </div>
            {editingPackage?.addons && editingPackage.addons.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold">Add-on Prices</h4>
                {editingPackage.addons.map(addon => (
                  <div key={addon.name} className="flex items-center justify-between">
                    <Label htmlFor={`addon-price-${addon.name}`}>{addon.name}</Label>
                    <Input
                      id={`addon-price-${addon.name}`}
                      type="number"
                      value={addon.price}
                      onChange={(e) => handleAddonPriceChange(addon.name, Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2"/>} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
