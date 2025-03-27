import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Types for medicines
interface Medicine {
  id: number;
  name: string;
  dosage: string;
  quantity: number;
  expiryDate: string;
  prescriptionRequired: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface MedicineFormData {
  name: string;
  dosage: string;
  quantity: number;
  expiryDate: string;
  prescriptionRequired: boolean;
}

export default function MedicineTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    dosage: "",
    quantity: 1,
    expiryDate: format(new Date().setMonth(new Date().getMonth() + 12), "yyyy-MM-dd"),
    prescriptionRequired: false,
  });
  
  // Fetch user's medicines
  const { 
    data: medicines = [], 
    isLoading,
    isError: isMedicinesError 
  } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
    enabled: !!user,
  });
  
  // Show error toast if medicines failed to load
  useEffect(() => {
    if (isMedicinesError) {
      toast({
        title: "Error",
        description: "Failed to load medicines. Please try again.",
        variant: "destructive",
      });
    }
  }, [isMedicinesError, toast]);

  // Add medicine mutation
  const addMedicineMutation = useMutation({
    mutationFn: (medicineData: MedicineFormData) => 
      apiRequest("POST", "/api/medicines", medicineData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine added successfully.",
      });
      setShowAddDialog(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medicine. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update medicine quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => 
      apiRequest("PATCH", `/api/medicines/${id}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete medicine mutation
  const deleteMedicineMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/medicines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove medicine. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Filter medicines based on search term and expiry status
  const filterMedicines = (items: Medicine[], filter: string, searchText: string) => {
    const now = new Date();
    const lowercaseSearch = searchText.toLowerCase();
    
    return items.filter(medicine => {
      // Search filter
      const matchesSearch = medicine.name.toLowerCase().includes(lowercaseSearch) || 
                            medicine.dosage.toLowerCase().includes(lowercaseSearch);
      
      // Status filter
      const expiryDate = new Date(medicine.expiryDate);
      const isExpired = expiryDate < now;
      const isLowStock = medicine.quantity <= 5;
      
      switch(filter) {
        case "all":
          return matchesSearch;
        case "expiring-soon":
          // Within 30 days of expiry
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          return matchesSearch && (expiryDate <= thirtyDaysFromNow && expiryDate >= now);
        case "expired":
          return matchesSearch && isExpired;
        case "low-stock":
          return matchesSearch && isLowStock && !isExpired;
        default:
          return matchesSearch;
      }
    });
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) : value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMedicineMutation.mutate(formData);
  };
  
  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      quantity: 1,
      expiryDate: format(new Date().setMonth(new Date().getMonth() + 12), "yyyy-MM-dd"),
      prescriptionRequired: false,
    });
  };
  
  // Update medicine quantity
  const updateQuantity = (id: number, change: number) => {
    const medicine = (medicines as Medicine[]).find(m => m.id === id);
    if (medicine) {
      const newQuantity = Math.max(0, medicine.quantity + change);
      updateQuantityMutation.mutate({ id, quantity: newQuantity });
    }
  };
  
  // Determine if medicine is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    return expiry <= thirtyDaysFromNow && expiry >= now;
  };
  
  // Determine if medicine is expired
  const isExpired = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
  };
  
  // Format expiry date for display
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-primary bg-opacity-10 border-b border-neutral-dark">
        <CardTitle className="flex items-center justify-center">
          <span className="material-icons mr-2 text-primary">medication</span>
          Medicine Stock Tracker
        </CardTitle>
        <CardDescription>Track and manage your medications</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-icons text-sm">search</span>
            <Input
              placeholder="Search medications..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">
                <span className="material-icons mr-1 text-sm">add</span>
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Ibuprofen"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    placeholder="e.g., 200mg"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="prescriptionRequired"
                    name="prescriptionRequired"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-dark text-primary focus:ring-primary"
                    checked={formData.prescriptionRequired}
                    onChange={handleInputChange}
                  />
                  <Label htmlFor="prescriptionRequired" className="font-normal">
                    Prescription Required
                  </Label>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMedicineMutation.isPending}>
                    {addMedicineMutation.isPending ? "Adding..." : "Add Medicine"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="expiring-soon">Expiring Soon</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          
          {["all", "low-stock", "expiring-soon", "expired"].map((tab) => (
            <TabsContent key={tab} value={tab} className="pt-2">
              <ScrollArea className="h-[450px] pr-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filterMedicines(medicines as Medicine[], tab, searchTerm).length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <span className="material-icons text-4xl">medication</span>
                    <p className="mt-2">No medicines found</p>
                    {searchTerm && (
                      <p className="text-sm">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterMedicines(medicines as Medicine[], tab, searchTerm).map((medicine) => (
                      <Card key={medicine.id} className="relative overflow-hidden">
                        {isExpired(medicine.expiryDate) && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1">
                            Expired
                          </div>
                        )}
                        
                        {!isExpired(medicine.expiryDate) && isExpiringSoon(medicine.expiryDate) && (
                          <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1">
                            Expiring Soon
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium">{medicine.name}</h4>
                                {medicine.prescriptionRequired && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Prescription
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-text-secondary">
                                {medicine.dosage}
                              </p>
                              
                              <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                                <div>
                                  <span className="text-text-secondary">Quantity: </span>
                                  <span className={
                                    medicine.quantity <= 0 ? "text-red-500" :
                                    medicine.quantity <= 5 ? "text-yellow-500" : ""
                                  }>
                                    {medicine.quantity}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="text-text-secondary">Expires: </span>
                                  <span className={
                                    isExpired(medicine.expiryDate) ? "text-red-500" :
                                    isExpiringSoon(medicine.expiryDate) ? "text-yellow-500" : ""
                                  }>
                                    {formatExpiryDate(medicine.expiryDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex border rounded-md">
                                <Button 
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-r-none"
                                  onClick={() => updateQuantity(medicine.id, -1)}
                                  disabled={medicine.quantity <= 0}
                                >
                                  <span className="material-icons text-sm">remove</span>
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-l-none"
                                  onClick={() => updateQuantity(medicine.id, 1)}
                                >
                                  <span className="material-icons text-sm">add</span>
                                </Button>
                              </div>
                              
                              <Button 
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-text-secondary hover:text-red-500"
                                onClick={() => 
                                  deleteMedicineMutation.mutate(medicine.id)
                                }
                              >
                                <span className="material-icons text-sm">delete</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}