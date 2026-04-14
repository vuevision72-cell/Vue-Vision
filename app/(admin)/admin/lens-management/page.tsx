
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenGlassesLensManager } from "./screen-glasses-lens-manager";
import { EyeglassesLensManager } from "./eyeglasses-lens-manager";

export default function LensManagementPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Lens Pricing Management</CardTitle>
                <CardDescription>
                    Visually edit the prices for all lens packages and add-ons across your store.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="screen-glasses">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="screen-glasses">Screen Glasses Lenses</TabsTrigger>
                        <TabsTrigger value="eyeglasses">Eyeglasses Lenses</TabsTrigger>
                    </TabsList>
                    <TabsContent value="screen-glasses">
                        <ScreenGlassesLensManager />
                    </TabsContent>
                    <TabsContent value="eyeglasses">
                        <EyeglassesLensManager />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
