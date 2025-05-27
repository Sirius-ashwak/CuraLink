import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types for medicines
interface Medicine {
  id: number;
  name: string;
  dosage: string;
  quantity: number;
  expiryDate: string;
  reorderLevel: number;
  prescriptionRequired: boolean;
  category: string;
  createdAt: string;
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
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
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
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/medicines"],
    enabled: !!user,
  });
  
  // Show error toast if medicines failed to load
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load medicines. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);
  
  // Filter medicines based on search term
  const filteredMedicines = medicines.filter((medicine: Medicine) => 
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Check if medicine is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };
  
  // Check if medicine is expired
  const isExpired = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };
  
  // Check if medicine is low on stock
  const isLowStock = (medicine: Medicine) => {
    return medicine.quantity <= medicine.reorderLevel;
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      quantity: 1,
      expiryDate: format(new Date().setMonth(new Date().getMonth() + 12), "yyyy-MM-dd"),
      prescriptionRequired: false,
    });
  };
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiRequest("/api/medicines", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          category: "Not specified", // Default category
          reorderLevel: 5, // Default reorder level
        }),
      });
      
      toast({
        title: "Success",
        description: "Medicine added successfully!",
        variant: "default",
      });
      
      // Refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      
      // Close dialog and reset form
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Failed to add medicine:", error);
      toast({
        title: "Error",
        description: "Failed to add medicine. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle getting medicine info
  const handleGetInfo = async (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowInfoDialog(true);
    setIsLoadingInfo(true);
    
    try {
      const info = await apiRequest(`/api/medicines/${medicine.id}/info`);
      if (info) {
        setMedicineInfo(info);
      }
    } catch (error) {
      console.error("Failed to get medicine info:", error);
      toast({
        title: "Error",
        description: "Failed to get medicine information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInfo(false);
    }
  };
  
  // Handle adjusting medicine quantity
  const handleAdjustQuantity = async () => {
    if (!selectedMedicine) return;
    
    try {
      await apiRequest(`/api/medicines/${selectedMedicine.id}/adjust-stock`, {
        method: "POST",
        body: JSON.stringify({
          adjustment: Number(adjustQuantity),
        }),
      });
      
      toast({
        title: "Success",
        description: `Updated ${selectedMedicine.name} quantity by ${adjustQuantity > 0 ? '+' : ''}${adjustQuantity}.`,
        variant: "default",
      });
      
      // Refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      
      // Close dialog and reset
      setShowAdjustDialog(false);
      setAdjustQuantity(0);
      setSelectedMedicine(null);
    } catch (error) {
      console.error("Failed to adjust medicine quantity:", error);
      toast({
        title: "Error",
        description: "Failed to adjust quantity. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting medicine
  const handleDelete = async () => {
    if (!selectedMedicine) return;
    
    try {
      await apiRequest(`/api/medicines/${selectedMedicine.id}`, {
        method: "DELETE",
      });
      
      toast({
        title: "Success",
        description: `Deleted ${selectedMedicine.name} successfully.`,
        variant: "default",
      });
      
      // Refetch medicines
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      
      // Close dialog and reset
      setShowDeleteDialog(false);
      setSelectedMedicine(null);
    } catch (error) {
      console.error("Failed to delete medicine:", error);
      toast({
        title: "Error",
        description: "Failed to delete medicine. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="p-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Medicines</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-between items-center mb-4">
          <div className="w-1/2">
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            Add Medicine
          </Button>
        </div>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading medicines...</p>
            </div>
          ) : filteredMedicines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine: Medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell>{medicine.name}</TableCell>
                    <TableCell>{medicine.dosage}</TableCell>
                    <TableCell>{medicine.category}</TableCell>
                    <TableCell>{medicine.quantity}</TableCell>
                    <TableCell>{new Date(medicine.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {isExpired(medicine.expiryDate) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isExpiringSoon(medicine.expiryDate) ? (
                        <Badge variant="warning">Expiring Soon</Badge>
                      ) : isLowStock(medicine) ? (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Good</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setShowAdjustDialog(true);
                          }}
                        >
                          Adjust
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGetInfo(medicine)}
                        >
                          Info
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setShowDeleteDialog(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">
                No medicines found. Add your first medicine to get started.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add Medicine
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="low-stock">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading medicines...</p>
            </div>
          ) : filteredMedicines.filter((m: Medicine) => isLowStock(m)).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines
                  .filter((m: Medicine) => isLowStock(m))
                  .map((medicine: Medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>{medicine.name}</TableCell>
                      <TableCell>{medicine.quantity}</TableCell>
                      <TableCell>{medicine.reorderLevel}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setShowAdjustDialog(true);
                            setAdjustQuantity(medicine.reorderLevel * 2 - medicine.quantity); // Suggest a reasonable restock amount
                          }}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                No medicines are currently low on stock. Good job!
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="expiring">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading medicines...</p>
            </div>
          ) : filteredMedicines.filter((m: Medicine) => isExpiringSoon(m.expiryDate) || isExpired(m.expiryDate)).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines
                  .filter((m: Medicine) => isExpiringSoon(m.expiryDate) || isExpired(m.expiryDate))
                  .sort((a: Medicine, b: Medicine) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                  .map((medicine: Medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>{medicine.name}</TableCell>
                      <TableCell>{new Date(medicine.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {isExpired(medicine.expiryDate) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="warning">Expiring Soon</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setShowDeleteDialog(true);
                          }}
                        >
                          Dispose
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                No medicines are expiring soon. All your medicines are up to date!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Medicine Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>
              Enter the details of the medicine you want to add to your inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dosage" className="text-right">
                  Dosage
                </Label>
                <Input
                  id="dosage"
                  name="dosage"
                  placeholder="e.g., 500mg, 5ml"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prescriptionRequired" className="text-right">
                  Prescription Required
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch
                    id="prescriptionRequired"
                    name="prescriptionRequired"
                    checked={formData.prescriptionRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, prescriptionRequired: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Medicine</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Medicine Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedMedicine?.name} Information
            </DialogTitle>
            <DialogDescription>
              Detailed information about this medication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingInfo ? (
              <div className="text-center py-4">
                <p>Loading information...</p>
              </div>
            ) : medicineInfo ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Uses</h4>
                  <p className="text-sm">{medicineInfo.uses || "Information not available"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Side Effects</h4>
                  <p className="text-sm">{medicineInfo.sideEffects || "Information not available"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Precautions</h4>
                  <p className="text-sm">{medicineInfo.precautions || "Information not available"}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Alternatives</h4>
                  <p className="text-sm">{medicineInfo.alternatives || "Information not available"}</p>
                </div>
              </>
            ) : (
              <p className="text-text-secondary">No information available for this medicine.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Adjust Quantity Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adjust {selectedMedicine?.name} Quantity
            </DialogTitle>
            <DialogDescription>
              Enter a positive number to add or a negative number to remove.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustQuantity" className="text-right">
                Adjustment
              </Label>
              <Input
                id="adjustQuantity"
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Current
              </Label>
              <div className="col-span-3">
                {selectedMedicine?.quantity || 0}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                New Total
              </Label>
              <div className="col-span-3 font-medium">
                {(selectedMedicine?.quantity || 0) + adjustQuantity}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAdjustDialog(false);
                setAdjustQuantity(0);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustQuantity}
              disabled={(selectedMedicine?.quantity || 0) + adjustQuantity < 0}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedMedicine?.name} from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}