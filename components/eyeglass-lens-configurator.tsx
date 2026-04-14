
"use client";

import { useState, useMemo, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useUserProfile } from "@/hooks/use-user-profile";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Eyeglass, EyeglassLensCategory, EyeglassLensSubcategory, EyeglassLensPackage, EyeglassPackageAddon, EyeglassPrescriptionValue, ZeroPowerPackage, LensColor } from "@/lib/types";
import { ArrowRight, ChevronLeft, Loader2, Upload, CheckCircle } from "lucide-react";

const PUBLIC_UPLOADS_BUCKET = "public_uploads";
const POWER_COST = 459;
const CUSTOM_COLOR_COST = 459;

const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.78.46 3.45 1.28 4.95L2 22l5.25-1.42c1.45.77 3.06 1.18 4.79 1.18h.01c5.46 0 9.9-4.45 9.9-9.9S17.5 2 12.04 2m-1.22 14.88l-.21.12c-1.23.69-2.67.95-4.13.75l-.26-.04-2.88.78.8-2.82-.05-.27c-.3-.82-.46-1.7-.46-2.61 0-4.3 3.49-7.8 7.8-7.8 2.1 0 4.06.83 5.51 2.29s2.29 3.41 2.29 5.51c-.01 4.3-3.5 7.8-7.81 7.8m4.4-3.23c-.22-.11-1.3-.65-1.5-.72s-.35-.11-.5.11-.57.72-.7 1.07-.26.22-.48.11c-.22-.11-.9-.33-1.72-.94-.64-.55-1.06-1.23-1.18-1.45s-.02-.34.1-.45c.1-.11.22-.28.33-.42.11-.14.14-.25.22-.42s.04-.31-.02-.42c-.06-.11-.5-1.2-.68-1.64s-.37-.36-.5-.37c-.12 0-.27-.01-.42-.01s-.4.06-.61.31-.79.78-.79 1.88.81 2.18.92 2.33c.12.15 1.58 2.42 3.83 3.39.54.23.96.36 1.29.47.63.2 1.2.17 1.65.1.5-.08 1.5-.61 1.71-1.2s.21-1.11.15-1.2z"
      />
    </svg>
  );


interface EyeglassLensConfiguratorProps {
    product: Eyeglass;
    configData: {
        lensCategories: EyeglassLensCategory[];
        lensSubcategories: EyeglassLensSubcategory[];
        lensPackages: EyeglassLensPackage[];
        packageAddons: EyeglassPackageAddon[];
        prescriptionValues: EyeglassPrescriptionValue[];
        zeroPowerPackages: ZeroPowerPackage[];
        contactInfo: { phone_number: string };
        tintColors: LensColor[];
    }
}

export default function EyeglassLensConfigurator({ product, configData }: EyeglassLensConfiguratorProps) {
    const router = useRouter();
    const { addItem } = useCart();
    const { profile } = useUserProfile([]);

    // Common state
    const [open, setOpen] = useState(false);
    const [flowType, setFlowType] = useState<'prescription' | 'zero_power' | null>(null);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prescription Flow State
    const [selectedCategory, setSelectedCategory] = useState<EyeglassLensCategory | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<EyeglassLensSubcategory | null>(null);
    const [selectedPrescriptionPackage, setSelectedPrescriptionPackage] = useState<EyeglassLensPackage | null>(null);
    const [selectedPrescriptionAddon, setSelectedPrescriptionAddon] = useState<EyeglassPackageAddon | null>(null);
    const [prescriptionType, setPrescriptionType] = useState<"manual" | "upload" | "whatsapp" | null>(null);
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
    const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);
    const [manualPrescription, setManualPrescription] = useState({
        right: { sph: "0.00", cyl: "NA", axis: "NA", add: "NA" },
        left: { sph: "0.00", cyl: "NA", axis: "NA", add: "NA" },
    });
    const [isUploading, setIsUploading] = useState(false);
    const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
    
    // Tinted Lens Flow State
    const [selectedTintColor, setSelectedTintColor] = useState<LensColor | null>(null);
    const [isCustomColorUploading, setIsCustomColorUploading] = useState(false);
    const [customColorFile, setCustomColorFile] = useState<File | null>(null);
    const [customColorUrl, setCustomColorUrl] = useState<string | null>(null);
    const customColorFileInputRef = useRef<HTMLInputElement>(null);


    // Zero Power Flow State
    const [selectedZeroPowerPackage, setSelectedZeroPowerPackage] = useState<ZeroPowerPackage | null>(null);
    const [selectedZeroPowerAddon, setSelectedZeroPowerAddon] = useState<any | null>(null);

    const whatsappLink = `https://wa.me/${configData.contactInfo.phone_number?.replace(/\D/g, '')}`;

    const resetAllState = () => {
        setFlowType(null);
        setStep(1);
        setIsSubmitting(false);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedPrescriptionPackage(null);
        setSelectedPrescriptionAddon(null);
        setPrescriptionType(null);
        setPrescriptionFile(null);
        setPrescriptionUrl(null);
        setManualPrescription({ right: { sph: "0.00", cyl: "NA", axis: "NA", add: "NA" }, left: { sph: "0.00", cyl: "NA", axis: "NA", add: "NA" }});
        setSelectedZeroPowerPackage(null);
        setSelectedZeroPowerAddon(null);
        setSelectedTintColor(null);
        setCustomColorFile(null);
        setCustomColorUrl(null);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setTimeout(resetAllState, 300); // Reset after dialog closes
        }
    };

    const handleAddToCart = async (lensConfig: any) => {
        if (!profile) {
            localStorage.setItem('redirectPath', window.location.pathname);
            router.push("/login");
            return;
        }
        setIsSubmitting(true);
        try {
            await addItem(product.id.toString(), 1, lensConfig);
            toast({ title: "Added to cart!", description: `${product.name} with custom lenses.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
            handleOpenChange(false);
        }
    };
    
    const handleStartFlow = (type: 'prescription' | 'zero_power') => {
        setOpen(true);
        setFlowType(type);
    };

    const handleBuyFrameOnly = () => {
        handleAddToCart({ type: 'frame_only', name: 'Frame Only', totalPrice: product.price });
    };
    
    // ----- Common helpers -----
    const goBack = () => {
        const nonSubcategoryLensTypes = ["Single Vision", "Bifocal Lens", "Progressive Lens"];
        
        if (selectedCategory?.name === 'Tinted Lens') {
            if (step === 5) { // From prescription
                setStep(10); // Go back to color selection
                return;
            }
             if (step === 10) { // From color selection
                setStep(1); // Go back to main category list
                return;
            }
        }
        
        if (step === 3 && selectedCategory && nonSubcategoryLensTypes.includes(selectedCategory.name)) {
             setStep(1); 
             return;
        }
        
        if (step > 1) {
            setStep(step - 1);
        } else {
            resetAllState();
            setOpen(false);
        }
    };

    const handleFileUpload = async (file: File, pathPrefix: 'prescriptions' | 'custom_colors'): Promise<string> => {
        if (!profile) throw new Error("User not logged in.");
        
        let uploaderStateUpdater;
        if (pathPrefix === 'prescriptions') {
            uploaderStateUpdater = setIsUploading;
        } else {
            uploaderStateUpdater = setIsCustomColorUploading;
        }
        
        uploaderStateUpdater(true);

        const filePath = `${pathPrefix}/${profile.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from(PUBLIC_UPLOADS_BUCKET).upload(filePath, file);
        
        if (uploadError) {
            uploaderStateUpdater(false);
            throw new Error(`Could not upload file: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage.from(PUBLIC_UPLOADS_BUCKET).getPublicUrl(filePath);
        uploaderStateUpdater(false);
        return publicUrl;
    };
    
    // ----- Zero Power Flow -----
    const zeroPowerTotalPrice = useMemo(() => {
        let total = product.price;
        if (selectedZeroPowerPackage) {
            total += Number(selectedZeroPowerPackage.price);
        }
        if (selectedZeroPowerAddon) {
            total += Number(selectedZeroPowerAddon.price);
        }
        return total;
    }, [product.price, selectedZeroPowerPackage, selectedZeroPowerAddon]);

    const handleZeroPowerPackageSelect = (pkg: ZeroPowerPackage) => {
        setSelectedZeroPowerPackage(pkg);
        const hasAddons = pkg.addons && (pkg.addons as any[]).length > 0;
        setStep(hasAddons ? 2 : 3);
    };

    const handleZeroPowerAddonSelect = (addonName: string) => {
        const addon = (selectedZeroPowerPackage?.addons as any[])?.find(a => a.name === addonName) || null;
        setSelectedZeroPowerAddon(addon);
        setStep(3);
    };

    const submitZeroPowerAndAddToCart = () => {
        if (!selectedZeroPowerPackage) return;
        const lensConfig: any = {
            type: 'zero_power',
            package: selectedZeroPowerPackage.name,
            addons: selectedZeroPowerAddon ? [selectedZeroPowerAddon.name] : [],
            totalPrice: zeroPowerTotalPrice,
        };
        handleAddToCart(lensConfig);
    };

    // ----- Prescription Flow -----
    const prescriptionTotalPrice = useMemo(() => {
        let total = product.price;
        
        if (selectedCategory?.name === 'Tinted Lens') {
            total += POWER_COST;
            if (customColorUrl) {
                total += CUSTOM_COLOR_COST;
            } else if (selectedTintColor) {
                total += Number(selectedTintColor.price);
            }
        } else {
            if (selectedPrescriptionPackage) {
                total += Number(selectedPrescriptionPackage.price);
            }
            if(selectedPrescriptionAddon?.price) {
                total += Number(selectedPrescriptionAddon.price);
            }
        }
        return total;
    }, [product.price, selectedPrescriptionPackage, selectedPrescriptionAddon, selectedCategory, selectedTintColor, customColorUrl]);

    const isBifocalOrProgressive = useMemo(() => {
        if (!selectedCategory) return false;
        const name = selectedCategory.name.toLowerCase();
        return name.includes('bifocal') || name.includes('progressive');
    }, [selectedCategory]);

    const subcategoriesForCategory = useMemo(() => {
        if (!configData || !selectedCategory) return [];
        return configData.lensSubcategories.filter((sc: EyeglassLensSubcategory) => sc.category_id === selectedCategory.id);
    }, [selectedCategory, configData]);

    const packagesForSubcategory = useMemo(() => {
        if (!configData || !selectedSubcategory) return [];
        return configData.lensPackages.filter((p: EyeglassLensPackage) => p.subcategory_id === selectedSubcategory.id);
    }, [selectedSubcategory, configData]);
    
    const addonsForPackage = useMemo(() => {
        if (!configData || !selectedPrescriptionPackage) return [];
        return configData.packageAddons.filter((pa: EyeglassPackageAddon) => pa.package_id === selectedPrescriptionPackage.id);
    }, [selectedPrescriptionPackage, configData]);

    const prescriptionValuesForCategory = useMemo(() => {
        if (!configData || !selectedCategory) return { sph: [], cyl: [], axis: [], add: [] };
        const values = configData.prescriptionValues.filter((v: EyeglassPrescriptionValue) => v.category_id === selectedCategory.id);
        return {
            sph: values.filter((v: EyeglassPrescriptionValue) => v.type === 'sph').sort((a,b) => parseFloat(a.value) - parseFloat(b.value)),
            cyl: values.filter((v: EyeglassPrescriptionValue) => v.type === 'cyl').sort((a,b) => (a.value === 'NA' ? -Infinity : parseFloat(a.value)) - (b.value === 'NA' ? -Infinity : parseFloat(b.value))),
            axis: values.filter((v: EyeglassPrescriptionValue) => v.type === 'axis').sort((a,b) => (a.value === 'NA' ? -Infinity : parseInt(a.value)) - (b.value === 'NA' ? -Infinity : parseInt(b.value))),
            add: values.filter((v: EyeglassPrescriptionValue) => v.type === 'add').sort((a,b) => (a.value === 'NA' ? -Infinity : parseFloat(a.value)) - (b.value === 'NA' ? -Infinity : parseFloat(b.value))),
        }
    }, [selectedCategory, configData]);

    const handlePrescriptionFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPrescriptionFile(file);
        try {
            const url = await handleFileUpload(file, 'prescriptions');
            setPrescriptionUrl(url);
        } catch(error: any) {
            toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        }
    };

    const handleCustomColorFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCustomColorFile(file);
        setSelectedTintColor(null); // Deselect predefined color
        try {
            const url = await handleFileUpload(file, 'custom_colors');
            setCustomColorUrl(url);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        }
    };


    const handlePrescriptionAddonSelect = (addonId: string) => {
        const addon = addonsForPackage.find(a => a.addon_id.toString() === addonId);
        setSelectedPrescriptionAddon(addon || null);
        setStep(5);
    };
    
    const handleCategorySelect = (category: EyeglassLensCategory) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
        setSelectedPrescriptionPackage(null);
        setSelectedPrescriptionAddon(null);

        if (category.name === 'Tinted Lens') {
            setStep(10); // Special step for Tinted Lens color selection
            return;
        }

        const subcats = configData?.lensSubcategories.filter((sc: EyeglassLensSubcategory) => sc.category_id === category.id) || [];
        if (subcats.length > 1) {
            setStep(2);
        } else if (subcats.length === 1) {
            setSelectedSubcategory(subcats[0]);
            setStep(3);
        } else {
             setStep(3); // If no subcategories, move to packages
        }
    };

    const handlePrescriptionPackageSelect = (pkg: EyeglassLensPackage) => {
        setSelectedPrescriptionPackage(pkg);
        const relevantAddons = configData.packageAddons.filter(pa => pa.package_id === pkg.id);
        if (relevantAddons.length > 0) {
            setStep(4);
        } else {
            setStep(5);
        }
    };

    const submitPrescriptionAndAddToCart = () => {
        if (!prescriptionType) {
            toast({ variant: "destructive", title: "Prescription Required", description: "Please provide your prescription." });
            return;
        }
        if (prescriptionType === 'upload' && !prescriptionUrl) {
            toast({ variant: "destructive", title: "File Required", description: "Please upload your prescription file." });
            return;
        }

        const lensConfig: any = {
            type: selectedCategory?.name,
            subcategory: selectedSubcategory?.name !== 'default' ? selectedSubcategory?.name : undefined,
            package: selectedPrescriptionPackage?.name,
            addons: selectedPrescriptionAddon ? [selectedPrescriptionAddon.addon.name] : [],
            tintColor: selectedTintColor?.name,
            customColorUrl: customColorUrl,
            totalPrice: prescriptionTotalPrice,
            prescription_details: prescriptionType === 'manual' 
                ? { type: 'manual', ...manualPrescription }
                : { type: prescriptionType, url: prescriptionUrl },
        };
        handleAddToCart(lensConfig);
    };
    
    const renderContent = () => {
        if (!open) {
            return null; // Don't render anything if dialog is closed
        }

        if (flowType === 'zero_power') {
            switch(step) {
                case 1: // Select Package
                     return (
                        <div className="space-y-3">
                            <h3 className="font-headline text-xl text-center">Choose a Zero Power Package</h3>
                            {configData.zeroPowerPackages.map(pkg => (
                                <div key={pkg.id} className={cn("rounded-lg border p-4 cursor-pointer transition-all", selectedZeroPowerPackage?.id === pkg.id ? "border-primary ring-2 ring-primary" : "hover:border-muted-foreground/50")} onClick={() => handleZeroPowerPackageSelect(pkg)}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                                        <p className="font-semibold text-primary">₹{Number(pkg.price)}</p>
                                    </div>
                                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside bg-secondary p-2 rounded-md">
                                        {pkg.features.map((feature, i) => <li key={i}>{feature}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    );
                case 2: // Select Addons
                    const currentAddons = selectedZeroPowerPackage?.addons || [];
                    return (
                        <div className="space-y-3">
                            <h3 className="font-headline text-xl text-center">Select Add-on</h3>
                            <RadioGroup onValueChange={handleZeroPowerAddonSelect} value={selectedZeroPowerAddon?.name}>
                                {(currentAddons as any[]).map(addon => (
                                    <Label key={addon.name} htmlFor={`zp-addon-${addon.name}`} className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer", {"ring-2 ring-primary border-primary": selectedZeroPowerAddon?.name === addon.name})}>
                                        <RadioGroupItem value={addon.name} id={`zp-addon-${addon.name}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">{addon.name}</span>
                                                <span className="font-semibold text-primary">+₹{addon.price}</span>
                                            </div>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                             <Button className="w-full mt-4" variant="outline" onClick={() => setStep(3)}>
                               Skip Add-ons and Review
                            </Button>
                        </div>
                   );
                case 3: // Summary
                     return (
                        <div className="space-y-4">
                            <h3 className="font-headline text-xl text-center">Your Configuration</h3>
                            <Card className="p-4 bg-secondary">
                                <div className="space-y-2">
                                <div className="flex justify-between"><span>Frame: {product.name}</span><span>₹{product.price.toFixed(2)}</span></div>
                                {selectedZeroPowerPackage && <div className="flex justify-between"><span>Lens: {selectedZeroPowerPackage.name}</span><span>₹{Number(selectedZeroPowerPackage.price).toFixed(2)}</span></div>}
                                {selectedZeroPowerAddon && <div className="flex justify-between text-sm text-muted-foreground"><span>Add-on: {selectedZeroPowerAddon.name}</span><span>+ ₹{selectedZeroPowerAddon.price.toFixed(2)}</span></div>}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{zeroPowerTotalPrice.toFixed(2)}</span></div>
                                </div>
                            </Card>
                            <Button className="w-full" size="lg" onClick={submitZeroPowerAndAddToCart} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'Add to Cart'}
                            </Button>
                        </div>
                    );
            }
        }
        
        if (flowType === 'prescription') {
             switch(step) {
                case 1: // Select Category
                    return (
                        <div className="space-y-3">
                            <h3 className="font-headline text-xl text-center">Choose Lens Type</h3>
                            {configData.lensCategories.map((cat: EyeglassLensCategory) => (
                               <div key={cat.id} className="p-4 border rounded-lg cursor-pointer hover:border-primary" onClick={() => handleCategorySelect(cat)}>
                                   <h4 className="font-bold">{cat.name}</h4>
                                   <p className="text-sm text-muted-foreground">{cat.description}</p>
                               </div>
                            ))}
                        </div>
                    );
                case 2: // Select SubCategory
                    return (
                        <div className="space-y-3">
                            <h3 className="font-headline text-xl text-center">Select {selectedCategory?.name} Option</h3>
                            {subcategoriesForCategory.map((sc: EyeglassLensSubcategory) => (
                                <div key={sc.id} className="p-4 border rounded-lg cursor-pointer hover:border-primary" onClick={() => { setSelectedSubcategory(sc); setStep(3); }}>
                                    <h4 className="font-bold">{sc.name}</h4>
                                </div>
                            ))}
                        </div>
                    );
                case 3: // Select Package
                    return (
                        <div className="space-y-3">
                            <h3 className="font-headline text-xl text-center">Choose a Package</h3>
                            {packagesForSubcategory.length > 0 ? (
                                packagesForSubcategory.map((pkg: EyeglassLensPackage) => (
                                <div key={pkg.id} className={cn("rounded-lg border p-4 cursor-pointer transition-all", selectedPrescriptionPackage?.id === pkg.id ? "border-primary ring-2 ring-primary" : "hover:border-muted-foreground/50")} onClick={() => handlePrescriptionPackageSelect(pkg)}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                                        <p className="font-semibold text-primary">₹{Number(pkg.price)}</p>
                                    </div>
                                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside bg-secondary p-2 rounded-md">
                                        {pkg.features.map((feature, i) => <li key={i}>{feature}</li>)}
                                    </ul>
                                </div>
                            ))
                            ) : (
                                <p className="text-center text-muted-foreground">No packages available for this selection.</p>
                            )}
                        </div>
                    );
                case 4: // Select Addons
                    const relevantAddons = addonsForPackage.filter(addon => addon.addon);
                    return (
                        <div className="space-y-3">
                           <h3 className="font-headline text-xl text-center">Select Add-on (Optional)</h3>
                            <RadioGroup onValueChange={(value) => handlePrescriptionAddonSelect(value)} value={selectedPrescriptionAddon?.addon_id.toString()}>
                                {relevantAddons.map((pa: EyeglassPackageAddon) => (
                                    <Label key={pa.addon_id} htmlFor={`addon-${pa.addon_id}`} className={cn("flex items-center space-x-3 p-4 border rounded-lg cursor-pointer", {"ring-2 ring-primary border-primary": selectedPrescriptionAddon?.addon_id === pa.addon_id})}>
                                        <RadioGroupItem value={pa.addon_id.toString()} id={`addon-${pa.addon_id}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">{pa.addon.name}</span>
                                                <span className="font-semibold text-primary">+₹{pa.price}</span>
                                            </div>
                                        </div>
                                    </Label>
                               ))}
                           </RadioGroup>
                           <Button className="w-full mt-4" variant="outline" onClick={() => { setSelectedPrescriptionAddon(null); setStep(5); }}>
                              Skip Add-ons
                           </Button>
                       </div>
                   );
                case 5: // Enter Prescription
                     return (
                        <div className="space-y-6">
                            <h3 className="font-headline text-xl text-center">Provide Your Prescription</h3>
                            {selectedPrescriptionPackage?.power_range_info && <p className="text-sm text-center text-muted-foreground">{selectedPrescriptionPackage?.power_range_info}</p>}
    
                            <RadioGroup value={prescriptionType || ""} onValueChange={(value) => {
                                if (value !== 'whatsapp') setPrescriptionType(value as "manual" | "upload")
                            }} className="grid grid-cols-2 gap-4">
                                <Label htmlFor="manual-rx" className={cn("border rounded-md p-4 flex items-center justify-center cursor-pointer", {"ring-2 ring-primary border-primary": prescriptionType === 'manual'})}><RadioGroupItem value="manual" id="manual-rx" className="sr-only" />Enter Manually</Label>
                                <Label htmlFor="upload-rx" className={cn("border rounded-md p-4 flex items-center justify-center cursor-pointer", {"ring-2 ring-primary border-primary": prescriptionType === 'upload'})}><RadioGroupItem value="upload" id="upload-rx" className="sr-only" />Upload Prescription</Label>
                            </RadioGroup>
    
                            {prescriptionType === "manual" && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className={cn("grid gap-2 text-center font-medium text-muted-foreground text-sm", isBifocalOrProgressive ? "grid-cols-4" : "grid-cols-3")}>
                                    <div>SPH</div>
                                    <div>CYL</div>
                                    <div>AXIS</div>
                                    {isBifocalOrProgressive && <div>ADD</div>}
                                </div>
                                {['Right', 'Left'].map((eye) => (
                                    <div key={eye} className="space-y-2">
                                        <Label className="font-semibold">{eye} Eye ({eye === 'Right' ? 'OD' : 'OS'})</Label>
                                        <div className={cn("grid gap-2", isBifocalOrProgressive ? "grid-cols-4" : "grid-cols-3")}>
                                            <Select onValueChange={(val) => setManualPrescription(prev => ({ ...prev, [eye.toLowerCase()]: { ...prev[eye.toLowerCase() as 'right' | 'left'], sph: val }}))} defaultValue={manualPrescription[eye.toLowerCase() as 'right' | 'left'].sph} ><SelectTrigger><SelectValue placeholder="SPH" /></SelectTrigger><SelectContent>{prescriptionValuesForCategory.sph.map((v: EyeglassPrescriptionValue) => <SelectItem key={`sph-${v.id}`} value={v.value}>{v.value}</SelectItem>)}</SelectContent></Select>
                                            <Select onValueChange={(val) => setManualPrescription(prev => ({ ...prev, [eye.toLowerCase()]: { ...prev[eye.toLowerCase() as 'right' | 'left'], cyl: val }}))} defaultValue={manualPrescription[eye.toLowerCase() as 'right' | 'left'].cyl}><SelectTrigger><SelectValue placeholder="CYL" /></SelectTrigger><SelectContent>{prescriptionValuesForCategory.cyl.map((v: EyeglassPrescriptionValue) => <SelectItem key={`cyl-${v.id}`} value={v.value}>{v.value}</SelectItem>)}</SelectContent></Select>
                                            <Select onValueChange={(val) => setManualPrescription(prev => ({ ...prev, [eye.toLowerCase()]: { ...prev[eye.toLowerCase() as 'right' | 'left'], axis: val }}))} defaultValue={manualPrescription[eye.toLowerCase() as 'right' | 'left'].axis}><SelectTrigger><SelectValue placeholder="Axis" /></SelectTrigger><SelectContent>{prescriptionValuesForCategory.axis.map((v: EyeglassPrescriptionValue) => <SelectItem key={`axis-${v.id}`} value={v.value}>{v.value}</SelectItem>)}</SelectContent></Select>
                                            {isBifocalOrProgressive && <Select onValueChange={(val) => setManualPrescription(prev => ({ ...prev, [eye.toLowerCase()]: { ...prev[eye.toLowerCase() as 'right' | 'left'], add: val }}))} defaultValue={manualPrescription[eye.toLowerCase() as 'right' | 'left'].add}><SelectTrigger><SelectValue placeholder="ADD" /></SelectTrigger><SelectContent>{prescriptionValuesForCategory.add.map((v: EyeglassPrescriptionValue) => <SelectItem key={`add-${v.id}`} value={v.value}>{v.value}</SelectItem>)}</SelectContent></Select>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
    
                            {prescriptionType === "upload" && (
                                <div className="pt-4 border-t flex flex-col items-center justify-center text-center">
                                    <Input type="file" ref={prescriptionFileInputRef} onChange={handlePrescriptionFileChange} className="hidden" accept="image/jpeg,image/png,application/pdf"/>
                                    <Button variant="outline" size="lg" className="w-auto" onClick={() => prescriptionFileInputRef.current?.click()} disabled={isUploading}>
                                        {isUploading && prescriptionFile ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                                        {prescriptionFile ? 'Change File' : 'Choose File'}
                                    </Button>
                                    {prescriptionFile && !isUploading && prescriptionUrl && <div className="mt-2 text-sm text-green-600 flex items-center"><CheckCircle className="mr-2 h-4 w-4"/>File uploaded: {prescriptionFile.name}</div>}
                                </div>
                            )}

                             <div className="relative py-4">
                                <Separator />
                                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OR</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="whatsapp-rx"
                                    checked={prescriptionType === 'whatsapp'}
                                    onCheckedChange={(checked) => setPrescriptionType(checked ? 'whatsapp' : null)}
                                />
                                <label
                                htmlFor="whatsapp-rx"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                I will provide my power later on WhatsApp
                                </label>
                            </div>

                            {prescriptionType === 'whatsapp' && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center text-sm">
                                    <p className="text-yellow-800">You've selected to submit your prescription later. Please proceed to review your selection.</p>
                                </div>
                            )}
                            <Button className="w-full mt-4" disabled={!prescriptionType || (prescriptionType === 'upload' && !prescriptionUrl)} onClick={() => setStep(6)}>
                                Review Your Selection <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    );
                case 6: // Prescription Summary
                    return (
                        <div className="space-y-4">
                            <h3 className="font-headline text-xl text-center">Your Configuration</h3>
                            <Card className="p-4 bg-secondary">
                                <div className="space-y-2">
                                <div className="flex justify-between"><span>Frame: {product.name}</span><span>₹{product.price.toFixed(2)}</span></div>
                                
                                {selectedCategory?.name === 'Tinted Lens' ? (
                                    <>
                                        <div className="flex justify-between"><span>Power Lenses</span><span>+ ₹{POWER_COST.toFixed(2)}</span></div>
                                        {customColorUrl ? (
                                            <div className="flex justify-between"><span>Custom Color</span><span>+ ₹{CUSTOM_COLOR_COST.toFixed(2)}</span></div>
                                        ) : selectedTintColor && (
                                            <div className="flex justify-between"><span>{selectedTintColor.name} Color</span><span>+ ₹{Number(selectedTintColor.price).toFixed(2)}</span></div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {selectedPrescriptionPackage && <div className="flex justify-between"><span>Lens: {selectedPrescriptionPackage.name}</span><span>+ ₹{Number(selectedPrescriptionPackage.price).toFixed(2)}</span></div>}
                                        {selectedPrescriptionAddon && <div className="flex justify-between text-sm text-muted-foreground"><span>Add-on: {selectedPrescriptionAddon.addon.name}</span><span>+ ₹{selectedPrescriptionAddon.price.toFixed(2)}</span></div>}
                                    </>
                                )}

                                <Separator />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{prescriptionTotalPrice.toFixed(2)}</span></div>
                                </div>
                            </Card>
                             {prescriptionType === 'manual' && (
                                <Card className="p-4 text-xs text-muted-foreground">
                                    <h4 className="font-bold text-sm text-foreground mb-2">Your Prescription</h4>
                                    <p>Right (OD): SPH {manualPrescription.right.sph}, CYL {manualPrescription.right.cyl}, AXIS {manualPrescription.right.axis}{isBifocalOrProgressive && `, ADD ${manualPrescription.right.add}`}</p>
                                    <p>Left (OS): SPH {manualPrescription.left.sph}, CYL {manualPrescription.left.cyl}, AXIS {manualPrescription.left.axis}{isBifocalOrProgressive && `, ADD ${manualPrescription.left.add}`}</p>
                                </Card>
                            )}
                            {prescriptionUrl && (
                                <Card className="p-4 text-xs text-green-600">
                                    <p className="flex items-center"><CheckCircle className="mr-2 h-4 w-4"/> Your prescription has been uploaded.</p>
                                </Card>
                            )}
                            {prescriptionType === 'whatsapp' && (
                                <Card className="p-4 text-xs text-yellow-700 bg-yellow-50">
                                    <p className="flex items-center"><CheckCircle className="mr-2 h-4 w-4"/> You will submit your prescription on WhatsApp after placing the order.</p>
                                </Card>
                            )}
                            <Button className="w-full" size="lg" onClick={submitPrescriptionAndAddToCart} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'Confirm & Add to Cart'}
                            </Button>
                        </div>
                    );
                case 10: // Select Tint Color (for Tinted Lens flow)
                    const TINT_COST = 459;
                    return (
                        <div className="space-y-4">
                            <h3 className="font-headline text-xl text-center">Choose a Tint Color</h3>
                            <p className="text-center text-muted-foreground text-sm">A fixed cost of ₹{TINT_COST} will be added for any color.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {configData.tintColors.map(color => (
                                    <button 
                                        key={color.id} 
                                        onClick={() => { setSelectedTintColor(color); setCustomColorFile(null); setCustomColorUrl(null); }}
                                        className={cn("border-2 rounded-lg p-2 text-center", selectedTintColor?.id === color.id ? "border-primary" : "border-transparent hover:border-muted-foreground/50")}
                                    >
                                        <div className="w-full h-16 rounded-md mb-2" style={{ backgroundColor: color.hex_code ?? '#cccccc' }}></div>
                                        <div className="font-medium text-sm">{color.name}</div>
                                        <div className="text-xs text-primary">+₹{Number(color.price).toFixed(2)}</div>
                                    </button>
                                ))}
                            </div>
                            <Separator className="my-6" />
                             <div>
                                <Label className="font-semibold">Have a different color in mind?</Label>
                                <p className="text-sm text-muted-foreground mb-3">Upload an image of your desired color. (+₹{CUSTOM_COLOR_COST})</p>
                                <Input type="file" ref={customColorFileInputRef} onChange={handleCustomColorFileChange} className="hidden" accept="image/jpeg,image/png"/>
                                <Button variant="outline" onClick={() => customColorFileInputRef.current?.click()} disabled={isCustomColorUploading}>
                                    {isCustomColorUploading ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                                    {customColorFile ? 'Change Custom Color' : 'Upload Custom Color'}
                                </Button>
                                {customColorFile && !isCustomColorUploading && customColorUrl && (
                                    <div className="mt-2 text-sm text-green-600 flex items-center">
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        File uploaded: {customColorFile.name}
                                    </div>
                                )}
                            </div>
                            <Button className="w-full mt-4" disabled={!selectedTintColor && !customColorUrl} onClick={() => setStep(5)}>
                                Continue to Prescription <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    );
            }
        }
        return null;
    }

    return (
        <>
            <div className="space-y-4 pt-4">
                <Button size="lg" className="w-full" onClick={() => handleStartFlow('prescription')}>Select Prescription Lenses</Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => handleStartFlow('zero_power')}>Buy with Zero Power</Button>
                <Button size="lg" variant="outline" className="w-full" onClick={handleBuyFrameOnly}>Buy Frame Only</Button>
            </div>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-xl md:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl flex items-center">
                            {(step > 1) && <Button variant="ghost" size="icon" className="mr-2" onClick={goBack}><ChevronLeft /></Button>}
                            Configure Your Lenses
                        </DialogTitle>
                        <DialogDescription>
                            Selected Frame: {product.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto p-1">
                        {renderContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
