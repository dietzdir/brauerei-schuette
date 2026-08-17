"use client";

import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import { Product, ProductVariant, ContainerType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { formatPrice, formatContainerType } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, (snap) => {
      const data: Product[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (confirm("Produkt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleToggleActive = async (prod: Product) => {
    const updated = prod.isActive === false ? true : false;
    try {
      await setDoc(doc(db, "products", prod.id), { ...prod, isActive: updated }, { merge: true });
    } catch (err) {
      console.error(err);
      alert("Fehler beim Aktualisieren des Status.");
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
          alert("Fehler beim Hochladen des Bildes.");
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setEditingProduct({ ...editingProduct, image: downloadURL });
          setUploadProgress(null);
        }
      );
    } catch (error) {
      console.error("Resize error:", error);
      alert("Fehler bei der Bildverarbeitung vor dem Upload.");
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
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Speichern des Produkts.");
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
        <p className="font-heading uppercase text-sm text-[#0f4851]">Lade Katalog...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map(prod => {
            const isProdActive = prod.isActive !== false;
            return (
              <div 
                key={prod.id} 
                className={`rounded-none border p-5 shadow-xs flex flex-col justify-between transition-all ${
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
                        <div className="size-14 rounded-none bg-[#f9f9f9] border border-[#c8d3d5] flex items-center justify-center text-[#505c5f]">
                          <ImageIcon className="size-6" />
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
                            <span className="text-[9px] bg-[#eeeeee] text-[#0f4851] px-2 py-0.5 rounded-none font-bold border border-[#c8d3d5]">
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
                          <span className="font-bold text-[#0f4851]">{formatPrice(v.price)}</span>
                        </li>
                      );
                    })}
                    {prod.variants.length === 0 && <li className="text-[#505c5f] italic text-xs">Keine Gebinde hinterlegt</li>}
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#c8d3d5]">
                <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee] h-8" onClick={() => handleEdit(prod)}>
                  <Pencil className="size-3 text-[#00A8BC]" /> Bearbeiten
                </Button>
                <Button variant="destructive" size="icon" className="shrink-0 rounded-none h-8 w-8" onClick={() => handleDelete(prod.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl md:max-w-3xl overflow-y-auto w-full sm:w-[90vw] p-0">
          <SheetHeader className="mb-6 px-4 pt-6 sm:px-6">
            <SheetTitle>{editingProduct?.id ? "Produkt bearbeiten" : "Neues Produkt anlegen"}</SheetTitle>
            <SheetDescription>
              Fülle die Details für den Artikel aus. 
            </SheetDescription>
          </SheetHeader>

          {editingProduct && (
            <div className="space-y-6 pb-20 px-4 sm:px-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="product-is-active"
                    checked={editingProduct.isActive !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="size-4.5 accent-amber-600 rounded cursor-pointer"
                  />
                  <Label htmlFor="product-is-active" className="cursor-pointer text-sm font-medium leading-snug">
                    Artikel im Shop anzeigen (Aktiv)
                    <span className="block text-xs font-normal text-slate-500 mt-0.5">
                      Wenn deaktiviert, ist der Artikel für Kunden im Shop unsichtbar, bleibt im Katalog aber gespeichert.
                    </span>
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label>Name des Produkts</Label>
                  <Input 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                    placeholder="z.B. Börde Pils"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Geschmacksprofil / Kurzbeschreibung</Label>
                  <Input 
                    value={editingProduct.flavorProfile || ""} 
                    onChange={e => setEditingProduct({...editingProduct, flavorProfile: e.target.value})} 
                    placeholder="z.B. Vollmundig, reiches Malzaroma, sanfte Hopfennote"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Kategorie</Label>
                    <Select 
                      value={editingProduct.category} 
                      onValueChange={(val) => {
                        if (val === "Beer" || val === "Lemonade") {
                          setEditingProduct({...editingProduct, category: val});
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {editingProduct.category === "Beer" ? "Bier" : editingProduct.category === "Lemonade" ? "Fassbrause / Limonade" : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beer" label="Bier">Bier</SelectItem>
                        <SelectItem value="Lemonade" label="Fassbrause / Limonade">Fassbrause / Limonade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Badge / Highlight</Label>
                    <Select 
                      value={editingProduct.badge || "none"} 
                      onValueChange={(val) => {
                        setEditingProduct({...editingProduct, badge: (!val || val === "none") ? "" : val});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {editingProduct.badge || "Kein Badge"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kein Badge</SelectItem>
                        <SelectItem value="Neu">Neu</SelectItem>
                        <SelectItem value="Bestseller">Bestseller</SelectItem>
                        <SelectItem value="Aktion">Aktion</SelectItem>
                        <SelectItem value="Saisonal">Saisonal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Beschreibung (optional)</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-none border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingProduct.description || ""} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Zutaten & Allergene (LMIV)</Label>
                  <Input 
                    value={editingProduct.ingredients || ""} 
                    onChange={e => setEditingProduct({...editingProduct, ingredients: e.target.value})} 
                    placeholder="z.B. Brauwasser, Gerstenmalz, Hopfen, Hefe"
                    className="rounded-none border-input"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Hinweis: Allergene wie <strong>Gerstenmalz</strong>, <strong>Weizenmalz</strong> etc. werden auf der Produktkarte automatisch fett hervorgehoben.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Alkoholgehalt</Label>
                    <div className="relative">
                      <Input 
                        value={editingProduct.alcohol || ""} 
                        onChange={e => setEditingProduct({...editingProduct, alcohol: e.target.value})} 
                        placeholder="z.B. 4,8"
                        className="pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        % vol.
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Farbe</Label>
                    <Input 
                      value={editingProduct.color || ""} 
                      onChange={e => setEditingProduct({...editingProduct, color: e.target.value})} 
                      placeholder="z.B. Hellgold"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Produktbild</Label>
                  <div className="flex items-center gap-4">
                    {editingProduct.image ? (
                      <img src={editingProduct.image} alt="Preview" className="size-16 rounded-md object-cover border" />
                    ) : (
                      <div className="size-16 rounded-md bg-slate-100 border flex items-center justify-center text-slate-400">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="relative">
                        <Input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <Button type="button" variant="outline" className="w-full pointer-events-none">Bild auswählen...</Button>
                      </div>
                      {uploadProgress !== null && (
                        <div className="w-full bg-slate-200 h-1.5 mt-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 pt-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="product-is-ai-generated"
                      checked={editingProduct.isAiGenerated === true}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isAiGenerated: e.target.checked })}
                      className="size-4 accent-[#0f4851] rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-[#505c5f] flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                      Bild ist KI-generiert (Wasserzeichen „✨ KI-Symbolbild“ auf Produktkarte einblenden)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Gebinde & Preise</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1 rounded-none border-[#c8d3d5]">
                    <Plus className="size-3" /> Gebinde hinzufügen
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
                    <p className="text-sm text-slate-500 italic text-center py-4">Füge mindestens ein Gebinde hinzu, damit Kunden das Produkt bestellen können.</p>
                  )}
                </div>
              </div>

              <Button className="w-full bg-[#00a8bc] hover:bg-[#0092a4] text-white font-bold uppercase tracking-wider h-11 rounded-none shadow-xs" onClick={saveProduct} disabled={isSaving || !editingProduct.name}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isSaving ? "Speichere..." : "Produkt speichern"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
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
      className={`p-3 rounded-none border transition-all ${
        isVarActive
          ? "bg-white border-[#c8d3d5]"
          : "bg-[#f9f9f9] border-dashed border-[#c8d3d5] opacity-75"
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_95px_95px_auto_auto] gap-3 items-end">
        <div className="grid gap-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-[#505c5f]">Gebinde-Typ</Label>
          <Select
            value={variant.type}
            onValueChange={(val) => {
              if (val) {
                updateVariant(index, "type", val as ContainerType);
              }
            }}
          >
            <SelectTrigger className="bg-white rounded-none border-[#c8d3d5] h-9">
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

        <div className="grid gap-1.5">
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

        <div className="flex items-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#505c5f] hover:text-red-600 hover:bg-red-50 rounded-none shrink-0"
            onClick={() => removeVariant(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

