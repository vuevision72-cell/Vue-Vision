'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomepageProductSelector } from './homepage-product-selector';

export default function HomepageManagementPage() {

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Homepage Showcase Management</CardTitle>
                <CardDescription>
                    Control which products are featured on your homepage.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="featured_products">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="featured_products">Featured Products</TabsTrigger>
                        <TabsTrigger value="top_contact_lenses">Top Contact Lenses</TabsTrigger>
                    </TabsList>
                    <TabsContent value="featured_products">
                        <HomepageProductSelector 
                            section="featured_products"
                            title="Featured Products"
                            description="Select products to show in the 'Featured Products' carousel on the homepage."
                        />
                    </TabsContent>
                    <TabsContent value="top_contact_lenses">
                         <HomepageProductSelector 
                            section="top_contact_lenses"
                            title="Top Contact Lenses"
                            description="Select contact lenses to showcase below the brand logos on the homepage."
                            defaultCategory='contact-lenses'
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
