
"use client";

import { useState, useMemo, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { ContactLens } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";

type Prescription = {
  sph: string;
  cyl: string;
  axis: string;
  ap: string;
};

type Config = {
  boxes: {
    od: number;
    os: number;
  };
  prescription: {
    od: Partial<Prescription>;
    os: Partial<Prescription>;
  };
  prescriptionUrl: string | null;
  totalPrice: number;
};

export default function ContactLensConfigurator({ product }: { product: ContactLens }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { profile } = useUserProfile([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [eyeSelection, setEyeSelection] = useState<'both' | 'od' | 'os'>('both');

  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<Config>({
    boxes: { od: 1, os: 1 },
    prescription: { od: {}, os: {} },
    prescriptionUrl: null,
    totalPrice: product.price * 2, // Default to 1 box each
  });

  const boxOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleEyeSelectionChange = (value: 'both' | 'od' | 'os') => {
    setEyeSelection(value);
    
    // Reset boxes and price when selection changes
    let newBoxes = { od: 0, os: 0 };
    if (value === 'both') {
      newBoxes = { od: 1, os: 1 };
    } else if (value === 'od') {
      newBoxes = { od: 1, os: 0 };
    } else if (value === 'os') {
      newBoxes = { od: 0, os: 1 };
    }
    
    setConfig(prev => ({
        ...prev,
        boxes: newBoxes,
        totalPrice: product.price * (newBoxes.od + newBoxes.os)
    }));
  };

  const handleBoxChange = (eye: "od" | "os", value: string) => {
    const newCount = parseInt(value) || 0;
    const newBoxes = { ...config.boxes, [eye]: newCount };
    setConfig(prev => ({
      ...prev,
      boxes: newBoxes,
      totalPrice: product.price * (newBoxes.od + newBoxes.os),
    }));
  };

  const handlePrescriptionChange = (eye: "od" | "os", field: keyof Prescription, value: string) => {
    setConfig(prev => ({
      ...prev,
      prescription: {
        ...prev.prescription,
        [eye]: {
          ...prev.prescription[eye],
          [field]: value,
        },
      },
    }));
  };
  
  const handleFileUpload = async (file: File): Promise<string> => {
      if (!profile) throw new Error("User not logged in.");
      const filePath = `prescriptions/${profile.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('public_uploads').upload(filePath, file);
      if (uploadError) {
          throw new Error(`Could not upload file: ${uploadError.message}`);
      }
      const { data: { publicUrl } } = supabase.storage.from('public_uploads').getPublicUrl(filePath);
      return publicUrl;
  };

  const handlePrescriptionFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file ) return;
    
    setIsUploading(true);
    try {
        const url = await handleFileUpload(file);
        setConfig(prev => ({...prev, prescriptionUrl: url }));
        toast({ title: "Upload Successful", description: file.name });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  const hasPrescriptionFields = product.has_spherical || product.has_cylindrical || product.has_axis;

  const handleAddToCart = async () => {
    if (!profile) {
      localStorage.setItem('redirectPath', window.location.pathname);
      router.push("/login");
      return;
    }
    
    if (eyeSelection === 'both' && (config.boxes.od === 0 || config.boxes.os === 0)) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: "Please select at least one box for each eye." });
        return;
    }

    if (config.boxes.od === 0 && config.boxes.os === 0) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: "Please select at least one box." });
        return;
    }


    setIsSubmitting(true);

    const finalConfig = { ...config };

    if (eyeSelection === 'od') {
        finalConfig.prescription.os = {}; // Clear other eye's prescription
    } else if (eyeSelection === 'os') {
        finalConfig.prescription.od = {}; // Clear other eye's prescription
    }

    const cartLensConfig = {
      type: 'contact_lenses',
      ...finalConfig
    };

    const totalBoxes = config.boxes.od + config.boxes.os;

    try {
      await addItem(product.id.toString(), totalBoxes, cartLensConfig);
      toast({
        title: "Added to Cart!",
        description: `${product.name} has been added to your cart.`,
      });
    } catch(err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle>Configure Your Lenses</CardTitle>
            <CardDescription>Price is per box. Base price: ₹{product.price.toFixed(2)}/box.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div>
                <Label className="font-semibold mb-2 block">I need lenses for</Label>
                <RadioGroup
                    value={eyeSelection}
                    onValueChange={(val) => handleEyeSelectionChange(val as 'both' | 'od' | 'os')}
                    className="grid grid-cols-3 gap-2"
                >
                    <Label htmlFor="select-both" className={cn("flex items-center justify-center p-3 border rounded-md cursor-pointer", {"ring-2 ring-primary border-primary": eyeSelection === 'both'})}><RadioGroupItem value="both" id="select-both" className="sr-only" />Both Eyes</Label>
                    <Label htmlFor="select-od" className={cn("flex items-center justify-center p-3 border rounded-md cursor-pointer", {"ring-2 ring-primary border-primary": eyeSelection === 'od'})}><RadioGroupItem value="od" id="select-od" className="sr-only" />Right Eye (OD)</Label>
                    <Label htmlFor="select-os" className={cn("flex items-center justify-center p-3 border rounded-md cursor-pointer", {"ring-2 ring-primary border-primary": eyeSelection === 'os'})}><RadioGroupItem value="os" id="select-os" className="sr-only" />Left Eye (OS)</Label>
                </RadioGroup>
            </div>


            <div className="grid grid-cols-2 gap-4 items-end pt-4 border-t">
                <div>
                    <Label htmlFor="od-boxes" className="font-semibold">Right Eye (OD)</Label>
                    <Select onValueChange={(val) => handleBoxChange('od', val)} value={config.boxes.od.toString()} disabled={eyeSelection === 'os'}>
                        <SelectTrigger id="od-boxes"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[0, ...boxOptions].map(num => <SelectItem key={`od-${num}`} value={num.toString()} disabled={eyeSelection === 'both' && num === 0}>{num} Box</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="os-boxes" className="font-semibold">Left Eye (OS)</Label>
                    <Select onValueChange={(val) => handleBoxChange('os', val)} value={config.boxes.os.toString()} disabled={eyeSelection === 'od'}>
                        <SelectTrigger id="os-boxes"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[0, ...boxOptions].map(num => <SelectItem key={`os-${num}`} value={num.toString()} disabled={eyeSelection === 'both' && num === 0}>{num} Box</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {(hasPrescriptionFields || product.has_ap) && <Separator />}

            {(hasPrescriptionFields || product.has_ap) && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Prescription Details</h3>
                    {/* Right Eye Prescription */}
                    <fieldset disabled={eyeSelection === 'os'} className="space-y-4 disabled:opacity-50">
                        <h4 className="font-medium text-muted-foreground">Right Eye (OD)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                             {product.has_ap && <div><Label htmlFor="od-ap">AP (OD)</Label><Select onValueChange={(val) => handlePrescriptionChange('od', 'ap', val)}><SelectTrigger id="od-ap"><SelectValue placeholder="Select AP" /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>}
                             {product.has_spherical && <div><Label htmlFor="od-sph">Spherical</Label><Input id="od-sph" placeholder="e.g. -2.25" onChange={(e) => handlePrescriptionChange('od', 'sph', e.target.value)} /></div>}
                             {product.has_cylindrical && <div><Label htmlFor="od-cyl">Cylindrical</Label><Input id="od-cyl" placeholder="e.g. -0.75" onChange={(e) => handlePrescriptionChange('od', 'cyl', e.target.value)} /></div>}
                             {product.has_axis && <div><Label htmlFor="od-axis">Axis</Label><Input id="od-axis" placeholder="e.g. 90" onChange={(e) => handlePrescriptionChange('od', 'axis', e.target.value)} /></div>}
                        </div>
                    </fieldset>
                    
                    {/* Left Eye Prescription */}
                    <fieldset disabled={eyeSelection === 'od'} className="space-y-4 disabled:opacity-50">
                        <h4 className="font-medium text-muted-foreground">Left Eye (OS)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                             {product.has_ap && <div><Label htmlFor="os-ap">AP (OS)</Label><Select onValueChange={(val) => handlePrescriptionChange('os', 'ap', val)}><SelectTrigger id="os-ap"><SelectValue placeholder="Select AP" /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>}
                             {product.has_spherical && <div><Label htmlFor="os-sph">Spherical</Label><Input id="os-sph" placeholder="e.g. -2.50" onChange={(e) => handlePrescriptionChange('os', 'sph', e.target.value)} /></div>}
                             {product.has_cylindrical && <div><Label htmlFor="os-cyl">Cylindrical</Label><Input id="os-cyl" placeholder="e.g. -0.75" onChange={(e) => handlePrescriptionChange('os', 'cyl', e.target.value)} /></div>}
                             {product.has_axis && <div><Label htmlFor="os-axis">Axis</Label><Input id="os-axis" placeholder="e.g. 100" onChange={(e) => handlePrescriptionChange('os', 'axis', e.target.value)} /></div>}
                        </div>
                    </fieldset>
                </div>
            )}

             {hasPrescriptionFields && (
                <div>
                     <p className="text-center my-2 text-sm text-muted-foreground">OR</p>
                    <Input type="file" ref={prescriptionFileInputRef} onChange={handlePrescriptionFileChange} className="hidden" accept="image/jpeg,image/png,application/pdf"/>
                    <Button variant="outline" className="w-full" onClick={() => prescriptionFileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                        {config.prescriptionUrl ? 'Change Uploaded Prescription' : 'Upload Prescription'}
                    </Button>
                    {config.prescriptionUrl && !isUploading && <div className="mt-2 text-sm text-green-600 flex items-center justify-center"><CheckCircle className="mr-2 h-4 w-4"/>Prescription uploaded.</div>}
                </div>
            )}
        </CardContent>
       </Card>
      
      <Card className="p-4 bg-secondary">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Price:</span>
            <span>₹{config.totalPrice.toFixed(2)}</span>
          </div>
      </Card>

      <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
          Add to Cart
      </Button>
    </div>
  );
}
