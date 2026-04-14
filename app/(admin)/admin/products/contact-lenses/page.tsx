'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddContactLensForm } from "./add-contact-lens-form";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactLensesTable } from "./contact-lenses-table";
import type { ContactLens } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const brands = ["Bausch & Lomb", "Cooper Vision", "Alcon", "Johnson & Johnson", "Celebration"];
const disposabilityOptions = ["Monthly", "Day & Night", "Daily", "Yearly", "Bi-weekly"];
const powerTypes = ["Spherical", "Cylindrical/Toric", "Multifocal/Bifocal", "Colored"];

export default function ManageContactLensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ContactLens | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [filters, setFilters] = useState({
    searchTerm: '',
    brand: 'all',
    disposability: 'all',
    powerType: 'all',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }

  const handleProductUpdate = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setDataVersion(v => v + 1);
  }

  const onProductDeleted = () => {
    setDataVersion(v => v + 1);
  }

  const handleEditProduct = (product: ContactLens) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  const handleDialogOpening = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (!isOpen) {
        setEditingProduct(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="font-headline text-3xl">Manage Contact Lenses</CardTitle>
            <CardDescription>Add, edit, or remove contact lenses from your product catalog.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpening}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Contact Lens
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Contact Lens' : 'Add New Contact Lens'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the product details.' : "Enter the details for the new product. Click save when you're done."}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] p-4">
                <AddContactLensForm 
                    onProductUpdated={handleProductUpdate}
                    existingProduct={editingProduct}
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative md:col-span-4 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or ID..."
              className="w-full pl-8"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
           <Select value={filters.brand} onValueChange={(val) => handleFilterChange('brand', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
           </Select>
            <Select value={filters.disposability} onValueChange={(val) => handleFilterChange('disposability', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Disposability</SelectItem>
                  {disposabilityOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
           </Select>
            <Select value={filters.powerType} onValueChange={(val) => handleFilterChange('powerType', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Power Types</SelectItem>
                  {powerTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
           </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ContactLensesTable 
            dataVersion={dataVersion} 
            onProductDeleted={onProductDeleted} 
            onEditProduct={handleEditProduct}
            filters={filters}
        />
      </CardContent>
    </Card>
  );
}
