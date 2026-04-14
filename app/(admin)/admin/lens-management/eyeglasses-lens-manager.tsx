
'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EyeglassLensCategory, EyeglassLensSubcategory, EyeglassLensPackage, EyeglassPackageAddon, EyeglassAddon } from "@/lib/types";

type PackageWithAddons = EyeglassLensPackage & { addons: EyeglassPackageAddon[] };

export function EyeglassesLensManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<EyeglassLensCategory[]>([]);
  const [subcategories, setSubcategories] = useState<EyeglassLensSubcategory[]>([]);
  const [packages, setPackages] = useState<PackageWithAddons[]>([]);
  const [allAddons, setAllAddons] = useState<EyeglassAddon[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: cats, 1: subcats, 2: packages
  const [selectedCategory, setSelectedCategory] = useState<EyeglassLensCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<EyeglassLensSubcategory | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'package' | 'addon', data: any } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const catPromise = supabase.from('eyeglass_lens_categories').select('*');
      const subcatPromise = supabase.from('eyeglass_lens_subcategories').select('*');
      const pkgPromise = supabase.from('eyeglass_lens_packages').select('*');
      const pkgAddonPromise = supabase.from('eyeglass_package_addons').select('*');
      const addonPromise = supabase.from('eyeglass_addons').select('*');

      const [
        { data: catData, error: catErr },
        { data: subcatData, error: subcatErr },
        { data: pkgData, error: pkgErr },
        { data: pkgAddonData, error: pkgAddonErr },
        { data: addonData, error: addonErr },
      ] = await Promise.all([catPromise, subcatPromise, pkgPromise, pkgAddonPromise, addonPromise]);
      
      if (catErr || subcatErr || pkgErr || pkgAddonErr || addonErr) throw catErr || subcatErr || pkgErr || pkgAddonErr || addonErr;

      setCategories(catData || []);
      setSubcategories(subcatData || []);
      setAllAddons(addonData || []);
      
      const packagesWithAddons = (pkgData || []).map(pkg => ({
        ...pkg,
        addons: (pkgAddonData || []).filter(pa => pa.package_id === pkg.id).map(pa => ({
            ...pa,
            addon: (addonData || []).find(a => a.id === pa.addon_id)
        }))
      }));
      setPackages(packagesWithAddons);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch lens data." });
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const handleCategorySelect = (category: EyeglassLensCategory) => {
    setSelectedCategory(category);
    const hasSubcats = subcategories.some(sc => sc.category_id === category.id);
    if (hasSubcats) {
      setCurrentStep(1);
    } else {
        setSelectedSubcategory(null); // No subcategory for this path
        setCurrentStep(2);
    }
  };

  const handleSubcategorySelect = (subcategory: EyeglassLensSubcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentStep(2);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditClick = (type: 'package' | 'addon', data: any) => {
    setEditingItem({ type, data: { ...data } });
    setIsDialogOpen(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        data: { ...editingItem.data, price: Number(e.target.value) }
      });
    }
  };

  const handleSubmit = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    let error;

    if (editingItem.type === 'package') {
      ({ error } = await supabase
        .from('eyeglass_lens_packages')
        .update({ price: editingItem.data.price })
        .eq('id', editingItem.data.id));
    } else if (editingItem.type === 'addon') {
      ({ error } = await supabase
        .from('eyeglass_package_addons')
        .update({ price: editingItem.data.price })
        .match({ package_id: editingItem.data.package_id, addon_id: editingItem.data.addon_id }));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update price.' });
    } else {
      toast({ title: 'Success', description: 'Price has been updated.' });
      setIsDialogOpen(false);
      fetchData(); // Refetch all data
    }
    setIsSubmitting(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />);
    }
    
    switch (currentStep) {
      case 0: // Categories
        return categories.map(cat => (
          <Card key={cat.id} className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent" onClick={() => handleCategorySelect(cat)}>
            <div>
              <h3 className="font-bold text-lg">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <ChevronRight />
          </Card>
        ));
      case 1: // Subcategories
        return subcategories
          .filter(sc => sc.category_id === selectedCategory?.id)
          .map(sc => (
            <Card key={sc.id} className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent" onClick={() => handleSubcategorySelect(sc)}>
              <h3 className="font-bold text-lg">{sc.name}</h3>
              <ChevronRight />
            </Card>
          ));
      case 2: // Packages
        const filteredPackages = packages.filter(pkg => {
            if (selectedSubcategory) {
                return pkg.subcategory_id === selectedSubcategory.id;
            }
            if(selectedCategory) {
                const subcatIds = subcategories.filter(sc => sc.category_id === selectedCategory.id).map(sc => sc.id);
                return subcatIds.includes(pkg.subcategory_id) || pkg.subcategory_id === null;
            }
            return false;
        });

        return filteredPackages.map(pkg => (
          <Card key={pkg.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{pkg.name}</h3>
                <p className="font-semibold text-primary text-xl">₹{pkg.price}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEditClick('package', pkg)}>
                <Edit className="h-4 w-4 mr-2" /> Edit Price
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside bg-secondary p-2 rounded-md">
              {pkg.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
             {pkg.addons && pkg.addons.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold">Add-ons:</h4>
                  <div className="space-y-2 text-xs mt-1">
                    {pkg.addons.map(pa => pa.addon && (
                      <div key={pa.addon_id} className="flex justify-between items-center p-1 rounded-sm">
                        <span>{pa.addon.name}</span>
                        <div className="flex items-center gap-2">
                            <span>+ ₹{pa.price}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditClick('addon', pa)}>
                                <Edit className="h-3 w-3" />
                            </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Card>
        ));
      default:
        return null;
    }
  };

  return (
      <>
        <div className="my-6">
            {currentStep > 0 && (
                <Button variant="ghost" onClick={goBack}><ChevronLeft className="mr-2 h-4 w-4"/> Back</Button>
            )}
            <div className="space-y-4 mt-2">
                {renderContent()}
            </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Price</DialogTitle>
            </DialogHeader>
            {editingItem && (
                <div className="py-4">
                    <Label htmlFor="item-price">{editingItem.data.name || editingItem.data.addon?.name}</Label>
                    <Input
                    id="item-price"
                    type="number"
                    value={editingItem.data.price || 0}
                    onChange={handlePriceChange}
                    />
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2"/>} Save
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
  )
}
