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
import { AddScreenGlassForm } from "./add-screen-glass-form";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScreenGlassesTable } from "./screen-glasses-table";
import type { Eyeglass as ScreenGlass } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const frameTypes = ["Full Frame", "Rimless", "Half Rim"];
const frameShapes = ["Square", "Round", "Rectangle", "Geometric", "Cat Eye", "Aviator", "Oval"];
const genders = ["Men", "Women", "Unisex", "Kids"];

export default function ManageScreenGlassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ScreenGlass | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [filters, setFilters] = useState({
    searchTerm: '',
    gender: 'all',
    frameType: 'all',
    frameShape: 'all',
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };

  const handleProductUpdate = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setDataVersion(v => v + 1);
  }

  const onProductDeleted = () => {
    setDataVersion(v => v + 1);
  }

  const handleEditProduct = (product: ScreenGlass) => {
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
            <CardTitle className="font-headline text-3xl">Manage Screen Glasses</CardTitle>
            <CardDescription>Add, edit, or remove screen glasses from your product catalog.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpening}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Screen Glass
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Screen Glass' : 'Add New Screen Glass'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the product details.' : "Enter the details for the new product. Click save when you're done."}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] p-4">
                <AddScreenGlassForm 
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
           <Select value={filters.gender} onValueChange={(val) => handleFilterChange('gender', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
           </Select>
            <Select value={filters.frameType} onValueChange={(val) => handleFilterChange('frameType', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Frame Types</SelectItem>
                  {frameTypes.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
              </SelectContent>
           </Select>
            <Select value={filters.frameShape} onValueChange={(val) => handleFilterChange('frameShape', val)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Frame Shapes</SelectItem>
                  {frameShapes.map(fs => <SelectItem key={fs} value={fs}>{fs}</SelectItem>)}
              </SelectContent>
           </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScreenGlassesTable 
            dataVersion={dataVersion} 
            onProductDeleted={onProductDeleted}
            onEditProduct={handleEditProduct}
            filters={filters}
        />
      </CardContent>
    </Card>
  );
}
