
"use client";

import { useState, useMemo, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Sunglass, LensColor, PrescriptionValue } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle, ShoppingCart } from "lucide-react";
import { Checkbox } from "./ui/checkbox";


type Prescription = {
  sph: string;
  cyl: string;
  axis: string;
};

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

export type SunglassesConfig = {
  power: "with" | "without" | null;
  prescriptionType: "manual" | "upload" | "whatsapp" | null;
  manualPrescription: {
    right: Prescription;
    left: Prescription;
  };
  prescriptionFile: File | null;
  prescriptionUrl: string | null;
  color: LensColor | null;
  customColorFile: File | null;
  customColorUrl: string | null;
  totalPrice: number;
};

const POWER_COST = 459;
const CUSTOM_COLOR_COST = 459;

export default function SunglassesConfigurator({
  product,
  colors,
  prescriptionValues,
  contactInfo,
}: {
  product: Sunglass;
  colors: LensColor[];
  prescriptionValues: {
    sph: PrescriptionValue[];
    cyl: PrescriptionValue[];
    axis: PrescriptionValue[];
  };
  contactInfo: { phone_number: string };
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCustomColorUploading, setIsCustomColorUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const customColorFileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useUserProfile([]);
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const [config, setConfig] = useState<Omit<SunglassesConfig, 'totalPrice'>>({
    power: null,
    prescriptionType: null,
    manualPrescription: {
      right: { sph: "0.00", cyl: "NA", axis: "NA" },
      left: { sph: "0.00", cyl: "NA", axis: "NA" },
    },
    prescriptionFile: null,
    prescriptionUrl: null,
    color: null,
    customColorFile: null,
    customColorUrl: null,
  });

  const totalPrice = useMemo(() => {
    let total = Number(product.price);
    if (config.power === "with") {
      total += POWER_COST;
    }
    return total;
  }, [product.price, config.power]);

  const handleFileUpload = async (file: File, pathPrefix: 'prescriptions' | 'custom_colors'): Promise<string> => {
      if (!profile) throw new Error("User not logged in.");
      const filePath = `${pathPrefix}/${profile.id}/${Date.now()}_${file.name}`;
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
    setConfig(prev => ({...prev, prescriptionFile: file}));

    try {
        const url = await handleFileUpload(file, 'prescriptions');
        setConfig(prev => ({...prev, prescriptionUrl: url }));
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  const handleCustomColorFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCustomColorUploading(true);
    setConfig(prev => ({ ...prev, customColorFile: file, color: null })); // De-select pre-defined color

    try {
        const url = await handleFileUpload(file, 'custom_colors');
        setConfig(prev => ({ ...prev, customColorUrl: url }));
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
        setIsCustomColorUploading(false);
    }
  };

  const handleColorSelect = (color: LensColor | null) => {
    setConfig(prev => ({
        ...prev,
        color: prev.color?.id === color?.id ? null : color,
        customColorFile: null, // De-select custom color
        customColorUrl: null
    }))
  };

  const handlePrescriptionTypeChange = (value: string) => {
    setConfig({ ...config, prescriptionType: value as "manual" | "upload" | "whatsapp" });
  };

  const handleWithoutPowerAddToCart = async () => {
    if (!profile) {
      localStorage.setItem('redirectPath', window.location.pathname);
      router.push("/login");
      return;
    }
    setIsSubmitting(true);
    // Add to cart with 'without_power' configuration
    const lensConfig = { type: 'sunglasses', power: 'without', totalPrice: product.price };
    await addItem(product.id.toString(), 1, lensConfig);
    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your cart.`,
    });
    setIsSubmitting(false);
  };
  
  const whatsappLink = `https://wa.me/${contactInfo.phone_number?.replace(/\D/g, '')}?text=Hi, I need help with my prescription.`;

  const handleViewSummary = () => {
    if (!config.power) {
      toast({ variant: "destructive", title: "Please select a lens type." });
      return;
    }
    if (config.power === 'with' && !config.prescriptionType) {
        toast({ variant: "destructive", title: "Please provide your prescription." });
        return;
    }
    setIsSummaryOpen(true);
  };

  const handleAddToCart = async () => {
    if (!profile) {
      localStorage.setItem('redirectPath', window.location.pathname);
      router.push("/login");
      return;
    }

    if (!config.power) {
      toast({ variant: "destructive", title: "Please select a lens type." });
      return;
    }

    if (config.power === "with" && config.prescriptionType === null) {
      toast({ variant: "destructive", title: "Please provide your prescription." });
      return;
    }

    if (config.power === "with" && config.prescriptionType === 'upload' && !config.prescriptionUrl) {
      toast({ variant: "destructive", title: "Please upload your prescription file." });
      return;
    }

    setIsSubmitting(true);

    const lensConfigPayload: any = {
      type: 'sunglasses',
      power: config.power,
      color: config.color?.name,
      customColorUrl: config.customColorUrl,
      totalPrice: totalPrice,
      prescription_details: {},
    };

    if (config.power === 'with') {
        lensConfigPayload.prescription_details.type = config.prescriptionType;
        if (config.prescriptionType === 'manual') {
            lensConfigPayload.prescription_details.manual = config.manualPrescription;
        } else if (config.prescriptionType === 'upload') {
            lensConfigPayload.prescription_details.url = config.prescriptionUrl;
        } else if (config.prescriptionType === 'whatsapp') {
            // No details needed, just the type
        }
    }

    await addItem(product.id.toString(), 1, lensConfigPayload);

    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your cart.`,
    });
    setIsSubmitting(false);
    setIsSummaryOpen(false); // Close dialog after adding to cart
  };


  return (
    <div className="space-y-8">
      {/* Step 1: Power Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Choose Lens Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.power || ""}
            onValueChange={(value) =>
              setConfig({ ...config, power: value as "with" | "without" })
            }
            className="flex gap-4"
          >
            <Label
              htmlFor="without-power"
              className={cn("flex-1 p-4 border rounded-lg cursor-pointer", { "ring-2 ring-primary border-primary": config.power === "without" })}
            >
              <RadioGroupItem value="without" id="without-power" className="sr-only"/>
              <div className="font-bold">Without Power</div>
              <div className="text-sm text-muted-foreground">Standard zero-power lenses.</div>
            </Label>
            <Label
              htmlFor="with-power"
              className={cn("flex-1 p-4 border rounded-lg cursor-pointer", { "ring-2 ring-primary border-primary": config.power === "with" })}
            >
              <RadioGroupItem value="with" id="with-power" className="sr-only"/>
              <div className="font-bold">With Power (+₹{POWER_COST})</div>
              <div className="text-sm text-muted-foreground">Lenses with your prescription.</div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Step 2: Options for 'With Power' */}
      {config.power === "with" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Provide Your Prescription</CardTitle>
              <CardDescription>
                Choose how to provide your prescription details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={config.prescriptionType || ""}
                onValueChange={(value) => {
                  if (value !== 'whatsapp') setConfig({ ...config, prescriptionType: value as "manual" | "upload" });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                  <Label htmlFor="manual-rx" className={cn("border rounded-md p-4 flex items-center justify-center cursor-pointer", {"ring-2 ring-primary border-primary": config.prescriptionType === 'manual'})}><RadioGroupItem value="manual" id="manual-rx" className="sr-only" />Enter Manually</Label>
                  <Label htmlFor="upload-rx" className={cn("border rounded-md p-4 flex items-center justify-center cursor-pointer", {"ring-2 ring-primary border-primary": config.prescriptionType === 'upload'})}><RadioGroupItem value="upload" id="upload-rx" className="sr-only" />Upload Prescription</Label>
              </RadioGroup>

              {config.prescriptionType === "manual" && (
                <div className="space-y-4 pt-4 border-t">
                  {['Right', 'Left'].map((eye) => (
                      <div key={eye} className="space-y-2">
                          <Label className="font-semibold">{eye} Eye ({eye === 'Right' ? 'OD' : 'OS'})</Label>
                          <div className="grid grid-cols-3 gap-2">
                              <Select onValueChange={(val) => setConfig(prev => ({ ...prev, manualPrescription: { ...prev.manualPrescription, [eye.toLowerCase()]: { ...prev.manualPrescription[eye.toLowerCase() as 'right' | 'left'], sph: val }}}))} >
                                  <SelectTrigger><SelectValue placeholder="SPH" /></SelectTrigger>
                                  <SelectContent>
                                      {prescriptionValues.sph.map(v => <SelectItem key={`sph-${v.id}`} value={v.value}>{v.value}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                              <Select onValueChange={(val) => setConfig(prev => ({ ...prev, manualPrescription: { ...prev.manualPrescription, [eye.toLowerCase()]: { ...prev.manualPrescription[eye.toLowerCase() as 'right' | 'left'], cyl: val }}}))} >
                                  <SelectTrigger><SelectValue placeholder="CYL" /></SelectTrigger>
                                  <SelectContent>
                                      {prescriptionValues.cyl.map(v => <SelectItem key={`cyl-${v.id}`} value={v.value}>{v.value}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                              <Select onValueChange={(val) => setConfig(prev => ({ ...prev, manualPrescription: { ...prev.manualPrescription, [eye.toLowerCase()]: { ...prev.manualPrescription[eye.toLowerCase() as 'right' | 'left'], axis: val }}}))} >
                                  <SelectTrigger><SelectValue placeholder="Axis" /></SelectTrigger>
                                  <SelectContent>
                                      {prescriptionValues.axis.map(v => <SelectItem key={`axis-${v.id}`} value={v.value}>{v.value}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  ))}
                </div>
              )}
              
              {config.prescriptionType === "upload" && (
                  <div className="pt-4 border-t">
                      <Input type="file" ref={prescriptionFileInputRef} onChange={handlePrescriptionFileChange} className="hidden" accept="image/jpeg,image/png,application/pdf"/>
                      <Button variant="outline" onClick={() => prescriptionFileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                          {config.prescriptionFile ? 'Change File' : 'Choose File'}
                      </Button>
                      {config.prescriptionFile && !isUploading && config.prescriptionUrl && (
                          <div className="mt-2 text-sm text-green-600 flex items-center">
                              <CheckCircle className="mr-2 h-4 w-4"/>
                              File uploaded: {config.prescriptionFile.name}
                          </div>
                      )}
                  </div>
              )}
              
              <div className="relative py-4">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-sm text-muted-foreground">OR</span>
              </div>

              <div className="flex items-center space-x-2">
                  <Checkbox id="whatsapp-rx-sg"
                      checked={config.prescriptionType === 'whatsapp'}
                      onCheckedChange={(checked) => handlePrescriptionTypeChange(checked ? 'whatsapp' : '')}
                  />
                  <label
                  htmlFor="whatsapp-rx-sg"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                  I will provide my power later on WhatsApp
                  </label>
              </div>

               {config.prescriptionType === 'whatsapp' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center text-sm">
                      <p className="text-yellow-800">You've selected to submit your prescription later. Please proceed to the next step.</p>
                  </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                3. Select Lens Color
                <span className="text-muted-foreground text-sm font-normal ml-2">(Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {colors.map(color => (
                        <button key={color.id} onClick={() => handleColorSelect(color)} className={cn("border-2 rounded-lg p-2 text-center", config.color?.id === color.id ? "border-primary" : "border-transparent")}>
                            <div className="w-full h-12 rounded-md mb-2" style={{ backgroundColor: color.hex_code || '#cccccc' }}></div>
                            <div className="font-medium text-sm">{color.name}</div>
                        </button>
                    ))}
                </div>
                <Separator className="my-6" />
                <div>
                    <Label className="font-semibold">Have a different color in mind?</Label>
                    <p className="text-sm text-muted-foreground mb-3">Upload an image of your desired color.</p>
                    <Input type="file" ref={customColorFileInputRef} onChange={handleCustomColorFileChange} className="hidden" accept="image/jpeg,image/png"/>
                    <Button variant="outline" onClick={() => customColorFileInputRef.current?.click()} disabled={isCustomColorUploading}>
                        {isCustomColorUploading ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                        {config.customColorFile ? 'Change Custom Color' : 'Upload Custom Color'}
                    </Button>
                     {config.customColorFile && !isCustomColorUploading && config.customColorUrl && (
                        <div className="mt-2 text-sm text-green-600 flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4"/>
                            File uploaded: {config.customColorFile.name}
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>
        </>
      )}

      {config.power === 'without' ? (
        <Button size="lg" className="w-full" onClick={handleWithoutPowerAddToCart} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <ShoppingCart className="mr-2" />}
          Add to Cart (₹{product.price.toFixed(2)})
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={!config.power || (config.power === 'with' && !config.prescriptionType)}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <ShoppingCart className="mr-2" />}
            Add to Cart (₹{totalPrice.toFixed(2)})
        </Button>
      )}
    </div>
  );
}
