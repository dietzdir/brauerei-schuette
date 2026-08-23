"use client";

import React, { useState, useEffect } from "react";
import { query, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { getProductsCollection, getRentalsCollection } from "@/lib/firebase/converters";
import { Product, ProductVariant, ContainerType, RentalItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Sparkles, Wrench, Check } from "lucide-react";
import { formatPrice, formatContainerType } from "@/lib/utils";
import { toast } from "sonner";

const PRESET_PRODUCT_IMAGES = [
  { url: "/images/5-liter-fass.jpg", label: "5L Fass / Bierkrug", category: "Bier" },
  { url: "/images/fassbrause.jpg", label: "Fassbrause Zitrone", category: "Limonade" },
  { url: "/images/fassbrause2.jpg", label: "Fassbrause Himbeere", category: "Limonade" },
  { url: "/images/hopfenwasser.jpg", label: "Hopfenwasser", category: "Erfrischung" },
  { url: "/images/zapfanlage.jpg", label: "Profi-Zapfanlage", category: "Zubehör" },
  { url: "/images/schuette-logo.jpg", label: "Schütte Wappen", category: "Logo" },
];

function ImagePickerDialog({
  open,
  onOpenChange,
  currentImage,
  onSelectImage,
  onUploadCustom,
  uploadProgress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string;
  onSelectImage: (url: string) => void;
  onUploadCustom: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadProgress: number | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] flex flex-col bg-[#f9f9f9] border border-[#c8d3d5] rounded-none p-0 overflow-hidden shadow-xl">
        <DialogHeader className="p-4 sm:p-5 bg-white border-b border-[#c8d3d5] shrink-0">
          <DialogTitle className="font-heading text-lg sm:text-xl uppercase tracking-wider text-[#0f4851] flex items-center gap-2">
            <ImageIcon className="size-5 text-[#00A8BC]" />
            Produktbild auswählen
          </DialogTitle>
          <DialogDescription className="text-xs text-[#505c5f]">
            Wählen Sie ein Standardbild aus der Galerie oder laden Sie ein eigenes Foto hoch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Custom Upload Option */}
          <div className="bg-white p-4 border border-[#c8d3d5] rounded-none space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f4851] block">
              Eigenes Bild hochladen
            </span>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  await onUploadCustom(e);
                  onOpenChange(false);
                }}
                disabled={uploadProgress !== null}
                className="cursor-pointer rounded-none border-[#c8d3d5] h-10 text-xs"
              />
            </div>
            {uploadProgress !== null && (
              <div className="flex items-center gap-2 text-xs text-[#00A8BC] font-semibold pt-1">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Wird hochgeladen… {Math.round(uploadProgress)}%</span>
              </div>
            )}
            <p className="text-[11px] text-[#505c5f]">
              Wird automatisch auf WebP komprimiert (max. 800×800px).
            </p>
          </div>

          {/* Preset Gallery Grid */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f4851] block">
              Standard-Galerie
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_PRODUCT_IMAGES.map((preset) => {
                const isSelected = currentImage === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      onSelectImage(preset.url);
                      onOpenChange(false);
                    }}
                    className={`group relative flex flex-col bg-white border text-left rounded-none overflow-hidden transition-all duration-150 p-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A8BC] ${
                      isSelected
                        ? "border-[#00A8BC] ring-2 ring-[#00A8BC]/40 shadow-xs"
                        : "border-[#c8d3d5] hover:border-[#0f4851]"
                    }`}
                  >
                    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-[#00A8BC] text-white p-1 rounded-none shadow-xs">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 px-1 pb-1">
                      <span className="text-xs font-bold text-[#1a1c1c] block truncate">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-[#505c5f] uppercase tracking-wider">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 sm:px-5 bg-white border-t border-[#c8d3d5] shrink-0 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-[#c8d3d5] h-9 px-4 text-xs font-bold uppercase tracking-wider text-[#505c5f]"
          >
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



const CONTAINER_OPTIONS: ContainerType[] = [
  "0.75l bottle",
  "0.33l bottle",
  "5l keg",
  "10l keg",
  "30l keg",
  "50l keg"
];

const resizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas ctx missing"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
          "image/webp",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
};

export function CatalogManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Deletion modal state
  const [rentalToDelete, setRentalToDelete] = useState<RentalItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rental Sheet state
  const [rentalSheetOpen, setRentalSheetOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalItem | null>(null);
  const [isSavingRental, setIsSavingRental] = useState(false);
  const [rentalUploadProgress, setRentalUploadProgress] = useState<number | null>(null);

  // Image Picker Dialog state
  const [productImagePickerOpen, setProductImagePickerOpen] = useState(false);
  const [rentalImagePickerOpen, setRentalImagePickerOpen] = useState(false);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(getProductsCollection(db), (snapshot) => {
      const fetched: Product[] = snapshot.docs.map((docSnap) => docSnap.data());
      setProducts(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching catalog products:", err);
      setLoading(false);
    });

    const unsubscribeRentals = onSnapshot(getRentalsCollection(db), (snapshot) => {
      const fetched: RentalItem[] = snapshot.docs.map((docSnap) => docSnap.data());
      setRentals(fetched);
    }, (err) => {
      console.error("Error fetching catalog rentals:", err);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeRentals();
    };
  }, []);

  const handleOpenNewRental = () => {
    setEditingRental({
      id: "",
      name: "",
      description: "",
      image: "",
      isAiGenerated: false,
      rentalPriceCents: 0,
      depositCents: 0,
      totalStock: 1,
      isActive: true,
    });
    setRentalSheetOpen(true);
  };

  const handleEditRental = (rental: RentalItem) => {
    setEditingRental({ ...rental });
    setRentalSheetOpen(true);
  };

  const confirmDeleteRental = async () => {
    if (!rentalToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "rentals", rentalToDelete.id));
      toast.success(`Mietartikel „${rentalToDelete.name}“ wurde gelöscht.`);
      setRentalToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen des Mietartikels.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActiveRental = async (rental: RentalItem) => {
    const updated = rental.isActive === false ? true : false;
    try {
      await setDoc(doc(db, "rentals", rental.id), { ...rental, isActive: updated }, { merge: true });
      toast.success(`Mietartikel „${rental.name}“ ist nun ${updated ? "aktiv" : "inaktiv"}.`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Aktualisieren des Status.");
    }
  };

  const handleRentalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingRental) return;
    const file = e.target.files[0];
    setRentalUploadProgress(0);

    try {
      const resizedBlob = await resizeImage(file, 800, 800);
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const storageRef = ref(storage, `rentals/${Date.now()}_${safeName}.webp`);
      const uploadTask = uploadBytesResumable(storageRef, resizedBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setRentalUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed", error);
          toast.error("Fehler beim Hochladen des Bildes.");
          setRentalUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setEditingRental({ ...editingRental, image: downloadURL });
          toast.success("Bild erfolgreich hochgeladen.");
          setRentalUploadProgress(null);
        }
      );
    } catch (error) {
      console.error("Resize error:", error);
      toast.error("Fehler bei der Bildverarbeitung vor dem Upload.");
      setRentalUploadProgress(null);
    }
  };

  const saveRental = async () => {
    if (!editingRental) return;
    setIsSavingRental(true);
    try {
      let idToSave = editingRental.id;
      if (!idToSave) {
        idToSave = editingRental.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      const toSave = { ...editingRental, id: idToSave };
      await setDoc(doc(db, "rentals", idToSave), toSave);
      toast.success(`Mietartikel „${toSave.name}“ erfolgreich gespeichert.`);
      setRentalSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern des Mietartikels.");
    } finally {
      setIsSavingRental(false);
    }
  };

  const handleOpenNew = () => {
    setEditingProduct({
      id: "",
      name: "",
      category: "Beer",
      variants: [],
      isActive: true,
    });
    setSheetOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct({ ...prod }); // Copy
    setSheetOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      toast.success(`Produkt „${productToDelete.name}“ wurde gelöscht.`);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen des Produkts.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (prod: Product) => {
    const updated = prod.isActive === false ? true : false;
    try {
      await setDoc(doc(db, "products", prod.id), { ...prod, isActive: updated }, { merge: true });
      toast.success(`Produkt „${prod.name}“ ist nun ${updated ? "aktiv" : "inaktiv"}.`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Aktualisieren des Status.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProduct) return;
    const file = e.target.files[0];
    
    setUploadProgress(0); // Optional, signals resizing is starting

    try {
      const resizedBlob = await resizeImage(file, 800, 800);
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const storageRef = ref(storage, `products/${Date.now()}_${safeName}.webp`);
      const uploadTask = uploadBytesResumable(storageRef, resizedBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed", error);
          toast.error("Fehler beim Hochladen des Bildes.");
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setEditingProduct({ ...editingProduct, image: downloadURL });
          toast.success("Bild erfolgreich hochgeladen.");
          setUploadProgress(null);
        }
      );
    } catch (error) {
      console.error("Resize error:", error);
      toast.error("Fehler bei der Bildverarbeitung vor dem Upload.");
      setUploadProgress(null);
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      let idToSave = editingProduct.id;
      if (!idToSave) {
        // Generate new ID (e.g. lowercase dashed name)
        idToSave = editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      
      const toSave = { ...editingProduct, id: idToSave };
      await setDoc(doc(db, "products", idToSave), toSave);
      toast.success(`Produkt „${toSave.name}“ erfolgreich gespeichert.`);
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Fehler beim Speichern des Produkts.");
    } finally {
      setIsSaving(false);
    }
  };


  const addVariant = () => {
    setEditingProduct((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        variants: [
          ...prev.variants,
          { type: "0.75l bottle", price: 0, deposit: 0, isActive: true }
        ]
      };
    });
  };

  const updateVariant = (index: number, key: keyof ProductVariant, value: any) => {
    setEditingProduct((prev) => {
      if (!prev) return null;
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [key]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index: number) => {
    setEditingProduct((prev) => {
      if (!prev) return null;
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-wider text-[#0f4851]">Produktkatalog</h2>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f]">Katalog pflegen, Preise anpassen und Gebinde zuweisen.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-9 shadow-xs">
          <Plus className="size-4" /> Neues Produkt
        </Button>
      </div>

      {loading ? (
        <p className="font-heading uppercase text-sm text-[#0f4851]">Lade Katalog…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map(prod => {
            const isProdActive = prod.isActive !== false;
            return (
              <div 
                key={prod.id} 
                className={`rounded-none border p-5 shadow-xs flex flex-col justify-between transition-[opacity,border-color,background-color] duration-150 ${
                  isProdActive 
                    ? "bg-white border-[#c8d3d5]" 
                    : "bg-[#f9f9f9] border-dashed border-[#c8d3d5] opacity-75"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="size-14 rounded-none object-cover border border-[#c8d3d5]" />
                      ) : (
                        <div className="size-14 rounded-none bg-[#f4f6f7] border border-[#c8d3d5] flex items-center justify-center p-1 overflow-hidden shrink-0">
                          <img src="/images/schuette-logo.jpg" alt="Brauerei Schütte" className="w-full h-full object-contain opacity-75" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-heading text-lg leading-tight uppercase text-[#0f4851] mb-0.5">{prod.name}</h3>
                        {prod.flavorProfile && (
                          <p className="text-[11px] font-medium text-[#505c5f] mb-1 line-clamp-1">
                            {prod.flavorProfile}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider bg-[#0f4851] text-white px-2 py-0.5 rounded-none font-bold">
                            {prod.category === "Beer" ? "Bier" : "Limonade"}
                          </span>
                          {prod.badge && (
                            <span className="text-[9px] uppercase tracking-wider bg-[#00A8BC] text-white px-2 py-0.5 rounded-none font-bold">
                              {prod.badge}
                            </span>
                          )}
                          {prod.alcohol && (
                            <span className="text-[9px] bg-[#eeeeee] text-[#0f4851] px-2 py-0.5 rounded-none font-bold border border-[#c8d3d5] tabular-nums">
                              {prod.alcohol.includes("%") ? prod.alcohol : `${prod.alcohol} % vol.`}
                            </span>
                          )}
                          {prod.isAiGenerated && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-none font-bold border border-amber-300 flex items-center gap-0.5">
                              <Sparkles className="size-2.5 text-amber-600" />
                              KI-Bild
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Active Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer bg-[#f9f9f9] px-2.5 py-1.5 rounded-none border border-[#c8d3d5] text-[11px] font-bold uppercase tracking-wider shadow-2xs hover:bg-[#eeeeee] shrink-0">
                      <input
                        type="checkbox"
                        checked={isProdActive}
                        onChange={() => handleToggleActive(prod)}
                        className="size-3.5 accent-[#00A8BC] rounded-none cursor-pointer"
                      />
                      <span className={isProdActive ? "text-[#0f4851] font-bold" : "text-[#505c5f] font-medium"}>
                        {isProdActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </label>
                  </div>
                
                <div className="space-y-2 mb-4">
                  <h4 className="text-[11px] font-bold text-[#505c5f] uppercase tracking-wider">Verfügbare Gebinde</h4>
                  <ul className="text-xs space-y-1.5">
                    {prod.variants.map((v, i) => {
                      const isVarActive = v.isActive !== false;
                      return (
                        <li key={i} className={`flex justify-between items-center ${!isVarActive ? "text-[#505c5f] opacity-60" : "text-[#1a1c1c]"}`}>
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className={!isVarActive ? "line-through" : ""}>{formatContainerType(v.type)}</span>
                            {!isVarActive && (
                              <span className="text-[9px] font-bold uppercase bg-[#eeeeee] text-[#505c5f] px-1.5 py-0.2 rounded-none border border-[#c8d3d5]">
                                inaktiv
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-[#0f4851] tabular-nums">{formatPrice(v.price)}</span>
                        </li>
                      );
                    })}
                    {prod.variants.length === 0 && <li className="text-[#505c5f] italic text-xs">Keine Gebinde hinterlegt</li>}
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#c8d3d5]">
                <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee] h-8" onClick={() => handleEdit(prod)}>
                  <Pencil className="size-3 text-[#00A8BC]" aria-hidden="true" /> Bearbeiten
                </Button>
                <Button variant="destructive" size="icon" aria-label={`Produkt ${prod.name} löschen`} className="shrink-0 rounded-none h-8 w-8" onClick={() => setProductToDelete(prod)}>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Rentals & Equipment Section */}
      <div className="pt-8 border-t border-[#c8d3d5] space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-wider text-[#0f4851]">Zubehör & Verleih</h2>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#505c5f] mt-1">
              Verwalte Mietpreise, Kaution und den Bestand der Verleihartikel.
            </p>
          </div>

          <Button
            onClick={handleOpenNewRental}
            className="gap-2 bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-9 shadow-xs"
          >
            <Plus className="size-4" /> Neuer Mietartikel
          </Button>
        </div>

        {rentals.length === 0 ? (
          <div className="rounded-none border border-dashed border-[#c8d3d5] p-8 text-center bg-white">
            <p className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Keine Mietartikel angelegt.</p>
            <Button
              onClick={handleOpenNewRental}
              variant="outline"
              className="mt-3 text-xs font-bold uppercase tracking-wider rounded-none border-[#c8d3d5] text-[#0f4851]"
            >
              Mietartikel anlegen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rentals.map((rental) => {
              const isRentalActive = rental.isActive !== false;
              return (
                <div
                  key={rental.id}
                  className={`rounded-none border p-5 shadow-xs flex flex-col justify-between transition-[opacity,border-color,background-color] duration-150 ${
                    isRentalActive
                      ? "bg-white border-[#c8d3d5]"
                      : "bg-[#f9f9f9] border-dashed border-[#c8d3d5] opacity-75"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        {rental.image ? (
                          <img
                            src={rental.image}
                            alt={rental.name}
                            className="size-14 rounded-none object-cover border border-[#c8d3d5]"
                          />
                        ) : (
                          <div className="size-14 rounded-none bg-[#f4f6f7] border border-[#c8d3d5] flex items-center justify-center p-1 overflow-hidden shrink-0">
                            <Wrench className="size-6 text-[#0f4851]/50" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-heading text-lg leading-tight uppercase text-[#0f4851] mb-0.5">
                            {rental.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[9px] uppercase tracking-wider bg-[#0f4851] text-white px-2 py-0.5 rounded-none font-bold">
                              Bestand: {rental.totalStock} Stück
                            </span>
                            {rental.isAiGenerated && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-none font-bold border border-amber-300 flex items-center gap-0.5">
                                <Sparkles className="size-2.5 text-amber-600" />
                                KI-Bild
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Active Checkbox */}
                      <label className="flex items-center gap-1.5 cursor-pointer bg-[#f9f9f9] px-2.5 py-1.5 rounded-none border border-[#c8d3d5] text-[11px] font-bold uppercase tracking-wider shadow-2xs hover:bg-[#eeeeee] shrink-0">
                        <input
                          type="checkbox"
                          checked={isRentalActive}
                          onChange={() => handleToggleActiveRental(rental)}
                          className="size-3.5 accent-[#00A8BC] rounded-none cursor-pointer"
                        />
                        <span className={isRentalActive ? "text-[#0f4851] font-bold" : "text-[#505c5f] font-medium"}>
                          {isRentalActive ? "Aktiv" : "Inaktiv"}
                        </span>
                      </label>
                    </div>

                    {rental.description && (
                      <p className="text-xs text-[#505c5f] mb-3 line-clamp-2 leading-relaxed">
                        {rental.description}
                      </p>
                    )}

                    <div className="p-3 bg-[#f9f9f9] border border-[#c8d3d5] rounded-none space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#505c5f] font-bold uppercase tracking-wider text-[10px]">Mietpreis:</span>
                        <span className="font-bold text-[#0f4851] tabular-nums text-sm">
                          {formatPrice(rental.rentalPriceCents)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#505c5f] font-bold uppercase tracking-wider text-[10px]">Kaution:</span>
                        <span className="font-semibold text-[#505c5f] tabular-nums text-xs">
                          {rental.depositCents > 0 ? formatPrice(rental.depositCents) : "Keine (0,00 €)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#c8d3d5]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee] h-8"
                      onClick={() => handleEditRental(rental)}
                    >
                      <Pencil className="size-3 text-[#00A8BC]" aria-hidden="true" /> Bearbeiten
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`Mietartikel ${rental.name} löschen`}
                      className="shrink-0 rounded-none h-8 w-8"
                      onClick={() => setRentalToDelete(rental)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rental Editor Sheet */}
      <RentalEditorSheet
        open={rentalSheetOpen}
        onOpenChange={setRentalSheetOpen}
        rental={editingRental}
        setRental={setEditingRental}
        onSave={saveRental}
        isSaving={isSavingRental}
        uploadProgress={rentalUploadProgress}
        onImageUpload={handleRentalImageUpload}
        imagePickerOpen={rentalImagePickerOpen}
        setImagePickerOpen={setRentalImagePickerOpen}
      />


      {/* Editor Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl flex flex-col h-full bg-[#f9f9f9] border-l border-[#c8d3d5] rounded-none p-0 overflow-hidden">
          <SheetHeader className="p-4 sm:p-6 bg-white border-b border-[#c8d3d5] shrink-0 pr-12">
            <SheetTitle className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-[#0f4851]">
              {editingProduct?.id ? "Produkt bearbeiten" : "Neues Produkt anlegen"}
            </SheetTitle>
            <SheetDescription className="text-xs text-[#505c5f]">
              Pflegen Sie Stammdaten, LMIV-Angaben, Gebinde und Produktbilder.
            </SheetDescription>
          </SheetHeader>

          {editingProduct && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* 1. Status-Toggle (Top-Banner) */}
                <div className="p-4 bg-white border border-[#c8d3d5] rounded-none space-y-2 shadow-2xs">
                  <label htmlFor="product-is-active" className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="product-is-active"
                      checked={editingProduct.isActive !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                      className="size-5 accent-[#0f4851] rounded-none cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-bold text-[#0f4851]">
                      Artikel im Shop anzeigen (Aktiv)
                    </span>
                  </label>
                  <p className="text-xs text-[#505c5f] pl-8 leading-relaxed">
                    Wenn deaktiviert, ist der Artikel für Kunden im Shop unsichtbar, bleibt im Katalog aber gespeichert.
                  </p>
                </div>

                {/* 2. Basisdaten & Einstufung */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
                    Basisdaten & Einstufung
                  </h3>

                  <div className="grid gap-1.5">
                    <Label htmlFor="product-name" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                      Name des Produkts *
                    </Label>
                    <Input 
                      id="product-name"
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                      placeholder="z. B. Börde Pils"
                      className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="product-flavor" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                      Geschmacksprofil / Kurzbeschreibung
                    </Label>
                    <Input 
                      id="product-flavor"
                      value={editingProduct.flavorProfile || ""} 
                      onChange={e => setEditingProduct({...editingProduct, flavorProfile: e.target.value})} 
                      placeholder="z. B. Vollmundig, reiches Malzaroma, sanfte Hopfennote"
                      className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Kategorie *</Label>
                      <Select 
                        value={editingProduct.category} 
                        onValueChange={(val) => {
                          if (val === "Beer" || val === "Lemonade") {
                            setEditingProduct({...editingProduct, category: val});
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm">
                          <SelectValue>
                            {editingProduct.category === "Beer" ? "Bier" : editingProduct.category === "Lemonade" ? "Fassbrause / Limonade" : ""}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#c8d3d5]">
                          <SelectItem value="Beer" label="Bier">Bier</SelectItem>
                          <SelectItem value="Lemonade" label="Fassbrause / Limonade">Fassbrause / Limonade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Badge / Highlight</Label>
                      <Select 
                        value={editingProduct.badge || "none"} 
                        onValueChange={(val) => {
                          setEditingProduct({...editingProduct, badge: (!val || val === "none") ? "" : val});
                        }}
                      >
                        <SelectTrigger className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm">
                          <SelectValue>
                            {editingProduct.badge || "Kein Badge"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#c8d3d5]">
                          <SelectItem value="none">Kein Badge</SelectItem>
                          <SelectItem value="Neu">Neu</SelectItem>
                          <SelectItem value="Bestseller">Bestseller</SelectItem>
                          <SelectItem value="Aktion">Aktion</SelectItem>
                          <SelectItem value="Saisonal">Saisonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* 3. Produktdetails & LMIV-Pflichtangaben */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
                    Produktdetails & LMIV (Rechtliches)
                  </h3>

                  <div className="grid gap-1.5">
                    <Label htmlFor="product-description" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                      Ausführliche Beschreibung (optional)
                    </Label>
                    <textarea 
                      id="product-description"
                      className="flex min-h-[100px] w-full rounded-none border border-[#c8d3d5] bg-white px-3 py-2.5 text-sm leading-relaxed shadow-2xs placeholder:text-[#505c5f]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00a8bc]"
                      value={editingProduct.description || ""} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                      placeholder="z. B. Perfekt für alle, die ein geschmackvolles Bier mit angenehmer Tiefe und ausgewogener Balance schätzen."
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="product-ingredients" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                      Zutaten & Allergene (LMIV)
                    </Label>
                    <Input 
                      id="product-ingredients"
                      value={editingProduct.ingredients || ""} 
                      onChange={e => setEditingProduct({...editingProduct, ingredients: e.target.value})} 
                      placeholder="z. B. Brauwasser, Gerstenmalz, Hopfen, Hefe"
                      className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm"
                    />
                    <span className="text-[11px] text-[#505c5f] leading-snug">
                      Hinweis: Allergene wie <strong>Gerstenmalz</strong>, <strong>Weizenmalz</strong> etc. werden auf der Produktkarte automatisch fett hervorgehoben.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="product-alcohol" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                        Alkoholgehalt
                      </Label>
                      <div className="relative">
                        <Input 
                          id="product-alcohol"
                          value={editingProduct.alcohol || ""} 
                          onChange={e => setEditingProduct({...editingProduct, alcohol: e.target.value})} 
                          placeholder="z. B. 4,8"
                          className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm pr-16 tabular-nums"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#505c5f] pointer-events-none">
                          % vol.
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="product-color" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                        Bierfarbe / Aussehen
                      </Label>
                      <Input 
                        id="product-color"
                        value={editingProduct.color || ""} 
                        onChange={e => setEditingProduct({...editingProduct, color: e.target.value})} 
                        placeholder="z. B. Hellgold, Tief bernstein"
                        className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* 4. Produktbild & Kennzeichnung */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
                    Medien & Kennzeichnung
                  </h3>

                  <div className="grid gap-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Produktbild</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3.5 border border-[#c8d3d5] rounded-none">
                      {editingProduct.image ? (
                        <div className="relative size-20 rounded-none bg-slate-100 border border-[#c8d3d5] overflow-hidden shrink-0">
                          <img src={editingProduct.image} alt="Vorschau" className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="size-20 rounded-none bg-slate-100 border border-dashed border-[#c8d3d5] flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="size-8" />
                        </div>
                      )}
                      <div className="flex-1 w-full space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProductImagePickerOpen(true)}
                          className="w-full rounded-none border-[#c8d3d5] h-10 text-xs font-bold uppercase tracking-wider bg-white hover:bg-[#f0f7f8] text-[#0f4851] cursor-pointer"
                        >
                          <ImageIcon className="size-4 mr-2 text-[#00A8BC]" />
                          {editingProduct.image ? "Bild ändern / Galerie…" : "Bild auswählen / Galerie…"}
                        </Button>
                        {uploadProgress !== null && (
                          <div className="w-full bg-slate-200 h-1.5 rounded-none overflow-hidden">
                            <div className="bg-[#00a8bc] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Picker Dialog for Product */}
                    <ImagePickerDialog
                      open={productImagePickerOpen}
                      onOpenChange={setProductImagePickerOpen}
                      currentImage={editingProduct.image}
                      onSelectImage={(url) => setEditingProduct({ ...editingProduct, image: url })}
                      onUploadCustom={handleImageUpload}
                      uploadProgress={uploadProgress}
                    />

                    <label htmlFor="product-is-ai-generated" className="flex items-center gap-3 p-3 bg-white border border-[#c8d3d5] rounded-none cursor-pointer select-none min-h-[44px]">
                      <input
                        type="checkbox"
                        id="product-is-ai-generated"
                        checked={editingProduct.isAiGenerated === true}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isAiGenerated: e.target.checked })}
                        className="size-4.5 accent-[#0f4851] rounded-none cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-medium text-[#505c5f] flex items-center gap-1.5 leading-snug">
                        <Sparkles className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                        Bild ist KI-generiert (Wasserzeichen „KI-Symbolbild“ auf Produktkarte einblenden)
                      </span>
                    </label>
                  </div>
                </section>

                {/* 5. Gebinde & Preise */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#c8d3d5] pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851]">
                      Gebinde & Preise
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1 rounded-none border-[#c8d3d5] text-xs font-bold uppercase">
                      <Plus className="size-3.5" /> Gebinde hinzufügen
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {editingProduct.variants.map((variant, idx) => (
                      <VariantRow
                        key={idx}
                        variant={variant}
                        index={idx}
                        updateVariant={updateVariant}
                        removeVariant={removeVariant}
                      />
                    ))}
                    
                    {editingProduct.variants.length === 0 && (
                      <p className="text-xs text-[#505c5f] italic text-center py-4 bg-white border border-dashed border-[#c8d3d5]">
                        Fügen Sie mindestens ein Gebinde hinzu, damit Kunden das Produkt bestellen können.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="p-4 sm:px-6 bg-white border-t border-[#c8d3d5] shrink-0 flex items-center justify-end gap-3 shadow-md">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-none border-[#c8d3d5] h-10 px-4 text-xs font-bold uppercase tracking-wider"
                >
                  Abbrechen
                </Button>
                <Button 
                  className="bg-[#00a8bc] hover:bg-[#0092a4] text-white font-bold uppercase tracking-wider h-10 px-6 rounded-none shadow-xs" 
                  onClick={saveProduct} 
                  disabled={isSaving || !editingProduct.name}
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isSaving ? "Speichere..." : "Produkt speichern"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Product In-App Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-none border-[#c8d3d5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
              Produkt löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#505c5f]">
              Möchten Sie das Produkt <strong>{productToDelete?.name}</strong> endgültig löschen?
              <br /><br />
              <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-none border-[#c8d3d5] font-bold uppercase tracking-wider text-xs"
              disabled={isDeleting}
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="rounded-none bg-destructive hover:bg-destructive/90 text-white font-bold uppercase tracking-wider text-xs"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Rental In-App Confirmation Dialog */}
      <AlertDialog open={!!rentalToDelete} onOpenChange={(open) => !open && setRentalToDelete(null)}>
        <AlertDialogContent className="rounded-none border-[#c8d3d5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg uppercase tracking-wide text-[#0f4851]">
              Mietartikel löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#505c5f]">
              Möchten Sie den Mietartikel <strong>{rentalToDelete?.name}</strong> endgültig löschen?
              <br /><br />
              <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-none border-[#c8d3d5] font-bold uppercase tracking-wider text-xs"
              disabled={isDeleting}
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRental}
              disabled={isDeleting}
              className="rounded-none bg-destructive hover:bg-destructive/90 text-white font-bold uppercase tracking-wider text-xs"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin mr-1" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
              )}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function VariantRow({
  variant,
  index,
  updateVariant,
  removeVariant,
}: {
  variant: ProductVariant;
  index: number;
  updateVariant: (index: number, key: keyof ProductVariant, value: any) => void;
  removeVariant: (index: number) => void;
}) {
  const isVarActive = variant.isActive !== false;
  
  const centsToDisplay = (cents: number | undefined | null): string => {
    if (cents === undefined || cents === null) return "";
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  const [priceStr, setPriceStr] = useState<string>(() => centsToDisplay(variant.price));
  const [depositStr, setDepositStr] = useState<string>(() => centsToDisplay(variant.deposit));
  const isPriceFocused = React.useRef(false);
  const isDepositFocused = React.useRef(false);

  useEffect(() => {
    if (!isPriceFocused.current) {
      setPriceStr(centsToDisplay(variant.price));
    }
  }, [variant.price]);

  useEffect(() => {
    if (!isDepositFocused.current) {
      setDepositStr(centsToDisplay(variant.deposit));
    }
  }, [variant.deposit]);

  const parseCurrencyInput = (val: string): number => {
    if (!val || !val.trim()) return 0;
    const normalized = val.replace(",", ".").trim();
    const num = parseFloat(normalized);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  return (
    <div
      className={`p-3.5 rounded-none border transition-[opacity,border-color,background-color] duration-150 space-y-3 ${
        isVarActive
          ? "bg-white border-[#c8d3d5]"
          : "bg-[#f9f9f9] border-dashed border-[#c8d3d5] opacity-75"
      }`}
    >
      {/* Top Row: Gebinde-Typ + Status + Delete */}
      <div className="flex items-end gap-2.5">
        <div className="flex-1 min-w-0 grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Gebinde-Typ</Label>
          <Select
            value={variant.type}
            onValueChange={(val) => {
              if (val) {
                updateVariant(index, "type", val as ContainerType);
              }
            }}
          >
            <SelectTrigger className="bg-white rounded-none border-[#c8d3d5] h-9 text-xs">
              <SelectValue>{variant.type ? formatContainerType(variant.type) : "Wähle Gebinde..."}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-none border-[#c8d3d5]">
              {CONTAINER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {formatContainerType(opt as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0 grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f] text-center">Status</Label>
          <label className="flex items-center justify-center gap-1.5 h-9 px-2.5 bg-white border border-[#c8d3d5] cursor-pointer hover:bg-[#f9f9f9] select-none shadow-2xs">
            <input
              type="checkbox"
              checked={isVarActive}
              onChange={(e) => updateVariant(index, "isActive", e.target.checked)}
              className="size-3.5 accent-[#0f4851] rounded-none cursor-pointer"
            />
            <span className={`text-xs font-semibold ${isVarActive ? "text-emerald-700" : "text-[#505c5f]"}`}>
              {isVarActive ? "Aktiv" : "Inaktiv"}
            </span>
          </label>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#505c5f] hover:text-red-600 hover:bg-red-50 rounded-none shrink-0"
            onClick={() => removeVariant(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Row: Preis & Pfand */}
      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#f0f0f0]">
        <div className="grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Preis (€)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="bg-white rounded-none border-[#c8d3d5] text-xs font-semibold h-9"
            value={priceStr}
            onFocus={() => { isPriceFocused.current = true; }}
            onChange={(e) => {
              setPriceStr(e.target.value);
              updateVariant(index, "price", parseCurrencyInput(e.target.value));
            }}
            onBlur={() => {
              isPriceFocused.current = false;
              const cents = parseCurrencyInput(priceStr);
              setPriceStr(centsToDisplay(cents));
            }}
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Pfand (€)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="bg-white rounded-none border-[#c8d3d5] text-xs font-semibold h-9"
            value={depositStr}
            onFocus={() => { isDepositFocused.current = true; }}
            onChange={(e) => {
              setDepositStr(e.target.value);
              updateVariant(index, "deposit", parseCurrencyInput(e.target.value));
            }}
            onBlur={() => {
              isDepositFocused.current = false;
              const cents = parseCurrencyInput(depositStr);
              setDepositStr(centsToDisplay(cents));
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface RentalEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: RentalItem | null;
  setRental: React.Dispatch<React.SetStateAction<RentalItem | null>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
  uploadProgress: number | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  imagePickerOpen: boolean;
  setImagePickerOpen: (open: boolean) => void;
}

function RentalEditorSheet({
  open,
  onOpenChange,
  rental,
  setRental,
  onSave,
  isSaving,
  uploadProgress,
  onImageUpload,
  imagePickerOpen,
  setImagePickerOpen,
}: RentalEditorSheetProps) {
  if (!rental) return null;

  const centsToDisplay = (cents: number | undefined | null): string => {
    if (cents === undefined || cents === null) return "";
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  const parseCurrencyInput = (val: string): number => {
    if (!val || !val.trim()) return 0;
    const normalized = val.replace(",", ".").trim();
    const num = parseFloat(normalized);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  const [priceStr, setPriceStr] = useState<string>(() => centsToDisplay(rental.rentalPriceCents));
  const [depositStr, setDepositStr] = useState<string>(() => centsToDisplay(rental.depositCents));
  const isPriceFocused = React.useRef(false);
  const isDepositFocused = React.useRef(false);

  useEffect(() => {
    if (!isPriceFocused.current) {
      setPriceStr(centsToDisplay(rental.rentalPriceCents));
    }
  }, [rental.rentalPriceCents]);

  useEffect(() => {
    if (!isDepositFocused.current) {
      setDepositStr(centsToDisplay(rental.depositCents));
    }
  }, [rental.depositCents]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl flex flex-col h-full bg-[#f9f9f9] border-l border-[#c8d3d5] rounded-none p-0 overflow-hidden">
        <SheetHeader className="p-4 sm:p-6 bg-white border-b border-[#c8d3d5] shrink-0 pr-12">
          <SheetTitle className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-[#0f4851]">
            {rental.id ? "Mietartikel bearbeiten" : "Neuen Mietartikel anlegen"}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#505c5f]">
            Passe Bezeichnung, Mietpreis, Kaution, Bestand und Bild an.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Status-Toggle (Top-Banner) */}
          <div className="p-4 bg-white border border-[#c8d3d5] rounded-none space-y-2 shadow-2xs">
            <label htmlFor="rental-is-active" className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="rental-is-active"
                checked={rental.isActive !== false}
                onChange={(e) => setRental({ ...rental, isActive: e.target.checked })}
                className="size-5 accent-[#00A8BC] rounded-none cursor-pointer shrink-0"
              />
              <span className="text-sm font-bold text-[#0f4851]">
                Artikel im Shop zur Vermietung anbieten (Aktiv)
              </span>
            </label>
            <p className="text-xs text-[#505c5f] pl-8 leading-relaxed">
              Wenn deaktiviert, wird dieser Mietartikel für Kunden im Shop ausgeblendet.
            </p>
          </div>

          {/* 2. Stammdaten */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
              Basisdaten & Beschreibung
            </h3>

            <div className="grid gap-1.5">
              <Label htmlFor="rental-name" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                Bezeichnung des Mietartikels *
              </Label>
              <Input
                id="rental-name"
                value={rental.name}
                onChange={(e) => setRental({ ...rental, name: e.target.value })}
                placeholder="z. B. Profi-Bierzapfanlage mit Durchlaufkühler"
                className="bg-white rounded-none border-[#c8d3d5] h-10 text-sm font-medium"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="rental-desc" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                Beschreibung & Ausstattung
              </Label>
              <textarea
                id="rental-desc"
                className="flex min-h-[100px] w-full rounded-none border border-[#c8d3d5] bg-white px-3 py-2.5 text-sm leading-relaxed shadow-2xs placeholder:text-[#505c5f]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00a8bc]"
                value={rental.description || ""}
                onChange={(e) => setRental({ ...rental, description: e.target.value })}
                placeholder="z. B. 1 Biertisch (220 x 50 cm) und 2 Bierbänke (220 x 25 cm), klappbar und wetterfest lasiert."
              />
            </div>
          </section>

          {/* 3. Konditionen & Bestand */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
              Konditionen & Bestand
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="rental-price" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                  Mietpreis (€) *
                </Label>
                <Input
                  id="rental-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="25,00"
                  className="bg-white rounded-none border-[#c8d3d5] text-sm font-semibold h-10 tabular-nums"
                  value={priceStr}
                  onFocus={() => { isPriceFocused.current = true; }}
                  onChange={(e) => {
                    setPriceStr(e.target.value);
                    const cents = parseCurrencyInput(e.target.value);
                    setRental({ ...rental, rentalPriceCents: cents });
                  }}
                  onBlur={() => {
                    isPriceFocused.current = false;
                    const cents = parseCurrencyInput(priceStr);
                    setPriceStr(centsToDisplay(cents));
                  }}
                />
                <span className="text-[11px] text-[#505c5f]">Mietpreis pro Abholung.</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="rental-deposit" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                  Kaution (€)
                </Label>
                <Input
                  id="rental-deposit"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="bg-white rounded-none border-[#c8d3d5] text-sm font-semibold h-10 tabular-nums"
                  value={depositStr}
                  onFocus={() => { isDepositFocused.current = true; }}
                  onChange={(e) => {
                    setDepositStr(e.target.value);
                    const cents = parseCurrencyInput(e.target.value);
                    setRental({ ...rental, depositCents: cents });
                  }}
                  onBlur={() => {
                    isDepositFocused.current = false;
                    const cents = parseCurrencyInput(depositStr);
                    setDepositStr(centsToDisplay(cents));
                  }}
                />
                <span className="text-[11px] text-[#505c5f]">Bei 0 € entfällt Kaution.</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="rental-stock" className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">
                  Gesamtbestand *
                </Label>
                <Input
                  id="rental-stock"
                  type="number"
                  min="1"
                  max="99"
                  className="bg-white rounded-none border-[#c8d3d5] text-sm font-semibold h-10 tabular-nums"
                  value={rental.totalStock || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setRental({ ...rental, totalStock: isNaN(val) ? 1 : Math.max(1, val) });
                  }}
                />
                <span className="text-[11px] text-[#505c5f]">Max. buchbar pro Tag.</span>
              </div>
            </div>
          </section>

          {/* 4. Produktbild & Kennzeichnung */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f4851] flex items-center gap-1.5 border-b border-[#c8d3d5] pb-2">
              Medien & Kennzeichnung
            </h3>

            <div className="grid gap-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Produktbild</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-3.5 border border-[#c8d3d5] rounded-none">
                {rental.image ? (
                  <div className="relative size-20 bg-slate-100 border border-[#c8d3d5] rounded-none overflow-hidden shrink-0">
                    <img src={rental.image} alt="Vorschau" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="size-20 bg-slate-100 border border-dashed border-[#c8d3d5] rounded-none flex items-center justify-center text-slate-400 shrink-0">
                    <Wrench className="size-8 text-[#00A8BC]" />
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setImagePickerOpen(true)}
                    className="w-full rounded-none border-[#c8d3d5] h-10 text-xs font-bold uppercase tracking-wider bg-white hover:bg-[#f0f7f8] text-[#0f4851] cursor-pointer"
                  >
                    <ImageIcon className="size-4 mr-2 text-[#00A8BC]" />
                    {rental.image ? "Bild ändern / Galerie…" : "Bild auswählen / Galerie…"}
                  </Button>
                  {uploadProgress !== null && (
                    <div className="flex items-center gap-2 text-xs text-[#00A8BC] font-semibold">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Bild wird hochgeladen… {Math.round(uploadProgress)}%</span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#505c5f]">
                    Automatische Bildoptimierung (WebP, max. 800×800px).
                  </p>
                </div>
              </div>

              {/* Image Picker Dialog for Rental */}
              <ImagePickerDialog
                open={imagePickerOpen}
                onOpenChange={setImagePickerOpen}
                currentImage={rental.image}
                onSelectImage={(url) => setRental({ ...rental, image: url })}
                onUploadCustom={onImageUpload}
                uploadProgress={uploadProgress}
              />

              {/* AI Generated Watermark Toggle */}
              <label htmlFor="rental-is-ai" className="flex items-center gap-3 p-3 bg-white border border-[#c8d3d5] rounded-none cursor-pointer select-none min-h-[44px]">
                <input
                  type="checkbox"
                  id="rental-is-ai"
                  checked={rental.isAiGenerated ?? false}
                  onChange={(e) => setRental({ ...rental, isAiGenerated: e.target.checked })}
                  className="size-4.5 accent-[#00A8BC] rounded-none cursor-pointer shrink-0"
                />
                <span className="text-xs font-medium text-[#505c5f] flex items-center gap-1.5 leading-snug">
                  <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                  Bild ist KI-generiert (Wasserzeichen „KI-Symbolbild“ auf Produktkarte einblenden)
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="p-4 sm:px-6 bg-white border-t border-[#c8d3d5] shrink-0 flex items-center justify-end gap-3 shadow-md">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-[#c8d3d5] h-10 px-4 text-xs font-bold uppercase tracking-wider text-[#505c5f]"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !rental.name?.trim()}
            className="bg-[#00A8BC] hover:bg-[#0092a4] text-white rounded-none font-bold uppercase tracking-wider text-xs h-10 px-6 shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 mr-2 animate-spin" />
                Speichere…
              </>
            ) : (
              "Mietartikel speichern"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


