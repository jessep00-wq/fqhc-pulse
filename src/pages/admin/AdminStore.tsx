import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Upload, X, Settings2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/dashboard";
import { formatPrice, type StoreProduct } from "@/types/store";
import { mapStoreProduct } from "@/lib/storeMappers";
import { ProductHero, HERO_ICON_OPTIONS } from "@/components/store/ProductHero";

interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  amount_cents: number;
  currency: string;
  status: string;
  email_sent_at: string | null;
  stripe_session_id: string | null;
}

export default function AdminStore() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productFiles, setProductFiles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [productsRes, ordersRes, filesRes] = await Promise.all([
        supabase.from("store_products").select("*").order("sort_order"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("store_product_files").select("product_id, file_path").order("sort_order"),
      ]);
      const firstError = productsRes.error || ordersRes.error || filesRes.error;
      if (firstError) throw firstError;
      setProducts((productsRes.data ?? []).map(mapStoreProduct));
      setOrders((ordersRes.data as unknown as Order[]) ?? []);
      const grouped: Record<string, string[]> = {};
      for (const row of (filesRes.data ?? []) as Array<{ product_id: string; file_path: string }>) {
        (grouped[row.product_id] ||= []).push(row.file_path);
      }
      setProductFiles(grouped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load store data";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storefront"
        description="Manage product artwork, files, prices, and recent orders. Stripe products are managed in the Payments tab."
      />

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
        </div>
      )}

      {!loading && loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center justify-between gap-3">
            <p className="text-sm">{loadError}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !loadError && (
        <>
          <SectionCard
            title="Products"
            description={`${products.length} products · click any card to edit`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <ProductAdminCard
                  key={product.id}
                  product={product}
                  fileCount={(productFiles[product.id] ?? []).length}
                  files={productFiles[product.id] ?? []}
                  onChange={load}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent orders" description="Last 50 orders across all products">
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{o.customer_email}</TableCell>
                      <TableCell className="text-sm">{formatPrice(o.amount_cents, o.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.email_sent_at ? new Date(o.email_sent_at).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

interface CardProps {
  product: StoreProduct;
  fileCount: number;
  files: string[];
  onChange: () => void;
}

function ProductAdminCard({ product, fileCount, files, onChange }: CardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-4">
        <ProductHero
          imageUrl={product.hero_image_url}
          icon={product.hero_icon}
          size="lg"
          alt={product.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate">{product.name}</h3>
            <ProductEditorSheet product={product} files={files} onChange={onChange} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
            <Badge
              variant={product.status === "published" ? "default" : "outline"}
              className="text-[10px]"
            >
              {product.status}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-bold">{formatPrice(product.price_cents, product.currency)}</span>
            <span className="text-xs text-muted-foreground">
              {fileCount} {fileCount === 1 ? "file" : "files"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------

function ProductEditorSheet({
  product,
  files,
  onChange,
}: {
  product: StoreProduct;
  files: string[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(product.price_cents));
  const [guidance, setGuidance] = useState(product.buyer_guidance ?? "");
  const [heroIcon, setHeroIcon] = useState(product.hero_icon ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(product.hero_image_url ?? "");

  async function saveDetails() {
    const newPrice = parseInt(price, 10);
    if (Number.isNaN(newPrice) || newPrice < 0) return toast.error("Enter a valid price in cents");
    const { error } = await supabase
      .from("store_products")
      .update({
        price_cents: newPrice,
        buyer_guidance: guidance.trim() || null,
        hero_icon: heroIcon.trim() || null,
        hero_image_url: heroImageUrl.trim() || null,
      })
      .eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Product updated");
    onChange();
    setOpen(false);
  }

  async function uploadHeroImage(file: File) {
    const path = `hero/${product.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("product-previews")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("product-previews").getPublicUrl(path);
    setHeroImageUrl(pub.publicUrl);
    const { error } = await supabase
      .from("store_products")
      .update({ hero_image_url: pub.publicUrl })
      .eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Cover image updated");
    onChange();
  }

  async function uploadFile(file: File) {
    const path = `${product.id}/${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("product-files")
      .upload(path, file, { upsert: true });
    if (upErr) return toast.error(upErr.message);
    if (!files.includes(path)) {
      const { error: dbErr } = await supabase
        .from("store_product_files")
        .insert({ product_id: product.id, file_path: path, sort_order: files.length });
      if (dbErr) return toast.error(dbErr.message);
    }
    toast.success(`Uploaded ${file.name}`);
    onChange();
  }

  async function removeFile(path: string) {
    const { error: storageErr } = await supabase.storage.from("product-files").remove([path]);
    if (storageErr) return toast.error(storageErr.message);
    const { error: dbErr } = await supabase
      .from("store_product_files")
      .delete()
      .eq("product_id", product.id)
      .eq("file_path", path);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("File removed");
    onChange();
  }

  async function uploadPreview(file: File) {
    const path = `${product.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("product-previews")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("product-previews").getPublicUrl(path);
    const newUrls = Array.from(new Set([...(product.preview_image_urls ?? []), pub.publicUrl]));
    const { error } = await supabase
      .from("store_products")
      .update({ preview_image_urls: newUrls })
      .eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Preview uploaded");
    onChange();
  }

  async function removePreview(url: string) {
    const newUrls = (product.preview_image_urls ?? []).filter((u) => u !== url);
    const { error } = await supabase
      .from("store_products")
      .update({ preview_image_urls: newUrls })
      .eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Preview removed");
    onChange();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <ProductHero
              imageUrl={heroImageUrl || product.hero_image_url}
              icon={heroIcon || product.hero_icon}
              size="md"
              alt={product.name}
            />
            <span className="truncate">{product.name}</span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="hero">Cover</TabsTrigger>
            <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
            <TabsTrigger value="previews">Previews</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Display price (cents)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Updates display only — Stripe price stays the same.
              </p>
            </div>
            <div>
              <Label className="text-xs">Buyer guidance ("Best for…")</Label>
              <Input
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="Best if you're behind on a measure"
                className="mt-1"
              />
            </div>
            <Button onClick={saveDetails} className="w-full">Save details</Button>
          </TabsContent>

          <TabsContent value="hero" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs">Cover image (recommended)</Label>
              <p className="text-[11px] text-muted-foreground mt-1 mb-2">
                Overrides the icon. Square 400×400 or larger works best.
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadHeroImage(f);
                  e.target.value = "";
                }}
              />
              {heroImageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={heroImageUrl} alt="cover" className="h-16 w-16 rounded object-cover border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHeroImageUrl("");
                      void supabase.from("store_products").update({ hero_image_url: null }).eq("id", product.id).then(() => onChange());
                    }}
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Or choose an icon</Label>
              <Select value={heroIcon || "__none__"} onValueChange={(v) => setHeroIcon(v === "__none__" ? "" : v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Default (FileText)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Default</SelectItem>
                  {HERO_ICON_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <ProductHero imageUrl={heroImageUrl} icon={heroIcon} size="lg" />
              </div>
            </div>
            <Button onClick={saveDetails} className="w-full">Save cover</Button>
          </TabsContent>

          <TabsContent value="files" className="space-y-3 mt-4">
            <ul className="space-y-1">
              {files.map((path) => (
                <li key={path} className="flex items-center justify-between text-sm bg-muted px-2 py-1.5 rounded">
                  <span className="truncate">{path}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeFile(path)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
              {files.length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-4">No files uploaded</li>
              )}
            </ul>
            <Input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
                e.target.value = "";
              }}
            />
          </TabsContent>

          <TabsContent value="previews" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              {(product.preview_image_urls ?? []).map((url) => (
                <div key={url} className="relative group rounded overflow-hidden border bg-muted aspect-[4/3]">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(url)}
                    className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded bg-background/80 opacity-0 group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPreview(f);
                e.target.value = "";
              }}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
