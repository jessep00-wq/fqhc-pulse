import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice, type StoreProduct } from "@/types/store";
import { mapStoreProduct } from "@/lib/storeMappers";

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
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [guidance, setGuidance] = useState<Record<string, string>>({});

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from("store_products").select("*").order("sort_order"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setProducts((p ?? []).map(mapStoreProduct));
    setOrders((o as unknown as Order[]) ?? []);
  }

  async function handleUpload(productId: string, file: File) {
    const path = `${productId}/${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("product-files")
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const product = products.find((p) => p.id === productId);
    const newPaths = Array.from(new Set([...(product?.included_file_paths ?? []), path]));
    const { error: dbErr } = await supabase
      .from("store_products")
      .update({ included_file_paths: newPaths } as never)
      .eq("id", productId);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    toast.success(`Uploaded ${file.name}`);
    void load();
  }

  async function handlePreviewUpload(productId: string, file: File) {
    const path = `${productId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("product-previews")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("product-previews").getPublicUrl(path);
    const product = products.find((p) => p.id === productId);
    const newUrls = Array.from(new Set([...(product?.preview_image_urls ?? []), pub.publicUrl]));
    const { error: dbErr } = await supabase
      .from("store_products")
      .update({ preview_image_urls: newUrls } as never)
      .eq("id", productId);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    toast.success("Preview uploaded");
    void load();
  }

  async function removePreview(productId: string, url: string) {
    const product = products.find((p) => p.id === productId);
    const newUrls = (product?.preview_image_urls ?? []).filter((u) => u !== url);
    await supabase
      .from("store_products")
      .update({ preview_image_urls: newUrls } as never)
      .eq("id", productId);
    toast.success("Preview removed");
    void load();
  }

  async function removeFile(productId: string, path: string) {
    await supabase.storage.from("product-files").remove([path]);
    const product = products.find((p) => p.id === productId);
    const newPaths = (product?.included_file_paths ?? []).filter((p) => p !== path);
    await supabase
      .from("store_products")
      .update({ included_file_paths: newPaths } as never)
      .eq("id", productId);
    toast.success("File removed");
    void load();
  }

  async function savePrice(productId: string) {
    const newPrice = parseInt(editing[productId] ?? "", 10);
    if (Number.isNaN(newPrice) || newPrice < 0) {
      toast.error("Enter a valid price in cents");
      return;
    }
    const { error } = await supabase
      .from("store_products")
      .update({ price_cents: newPrice } as never)
      .eq("id", productId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Price updated. Note: this updates display only — Stripe price stays the same.");
    void load();
  }

  async function saveGuidance(productId: string) {
    const text = (guidance[productId] ?? "").trim() || null;
    const { error } = await supabase
      .from("store_products")
      .update({ buyer_guidance: text } as never)
      .eq("id", productId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Buyer guidance updated");
    void load();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Storefront</h1>
        <p className="text-sm text-muted-foreground">
          Manage product files, prices, and review recent orders. Stripe products are managed in the
          Payments tab; this view manages the public catalog and downloadable file delivery.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Products</h2>
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-base">
                    {product.hero_emoji} {product.name}
                  </CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{product.category}</Badge>
                    <Badge variant={product.status === "published" ? "default" : "outline"}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatPrice(product.price_cents)}</div>
                  <div className="text-xs text-muted-foreground">
                    Stripe: {product.stripe_price_id ?? "—"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Display price (cents)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    defaultValue={product.price_cents}
                    onChange={(e) => setEditing({ ...editing, [product.id]: e.target.value })}
                    className="w-40"
                  />
                  <Button size="sm" onClick={() => savePrice(product.id)}>Save</Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Buyer guidance ("Best for…")</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    defaultValue={product.buyer_guidance ?? ""}
                    placeholder="Best if you're behind on a measure"
                    onChange={(e) => setGuidance({ ...guidance, [product.id]: e.target.value })}
                  />
                  <Button size="sm" onClick={() => saveGuidance(product.id)}>Save</Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Files ({product.included_file_paths?.length ?? 0})</Label>
                <ul className="mt-1 space-y-1">
                  {(product.included_file_paths ?? []).map((path) => (
                    <li key={path} className="flex items-center justify-between text-sm bg-muted px-2 py-1 rounded">
                      <span className="truncate">{path}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeFile(product.id, path)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <Input
                  type="file"
                  className="mt-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(product.id, f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div>
                <Label className="text-xs">Preview screenshots ({product.preview_image_urls?.length ?? 0})</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(product.preview_image_urls ?? []).map((url) => (
                    <div key={url} className="relative group rounded overflow-hidden border bg-muted aspect-[4/3]">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePreview(product.id, url)}
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
                  className="mt-2"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handlePreviewUpload(product.id, f);
                    e.target.value = "";
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Email sent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="p-3">{o.customer_email}</td>
                    <td className="p-3">{formatPrice(o.amount_cents, o.currency)}</td>
                    <td className="p-3"><Badge variant="outline">{o.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">
                      {o.email_sent_at ? new Date(o.email_sent_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
