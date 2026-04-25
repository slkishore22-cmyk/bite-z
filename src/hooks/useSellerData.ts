import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSellerAuth } from "@/contexts/SellerAuthContext";

/* ---------- Categories ---------- */

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
};

/* ---------- Menu items ---------- */

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  prep_minutes: number | null;
  category_id: string | null;
  seller_id: string;
};

export const useMenuItems = () => {
  const { sellerProfile } = useSellerAuth();
  return useQuery({
    queryKey: ["menu-items", sellerProfile?.id],
    enabled: !!sellerProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("seller_id", sellerProfile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MenuItemRow[];
    },
  });
};

export const useUpsertMenuItem = () => {
  const qc = useQueryClient();
  const { sellerProfile } = useSellerAuth();
  return useMutation({
    mutationFn: async (item: Partial<MenuItemRow> & { name: string; price: number }) => {
      if (!sellerProfile) throw new Error("No seller");
      const payload = { ...item, seller_id: sellerProfile.id };
      const { data, error } = item.id
        ? await supabase.from("menu_items").update(payload).eq("id", item.id).select().single()
        : await supabase.from("menu_items").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
};

export const useDeleteMenuItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
};

export const useToggleMenuItemAvailable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
};

/* ---------- Orders ---------- */

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  placed_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  customer_id: string;
  delivery_address: any;
  notes: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export const useOrders = (params: {
  status?: string[]; // filter
  from?: Date;
  to?: Date;
  liveOnly?: boolean; // exclude completed/cancelled
}) => {
  const { sellerProfile } = useSellerAuth();
  return useQuery({
    queryKey: [
      "orders",
      sellerProfile?.id,
      params.liveOnly,
      params.from?.toISOString(),
      params.to?.toISOString(),
      params.status?.join(","),
    ],
    enabled: !!sellerProfile?.id,
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("seller_id", sellerProfile!.id)
        .order("placed_at", { ascending: false });

      if (params.liveOnly) {
        q = q.in("status", ["pending", "confirmed", "preparing", "ready", "out_for_delivery"]);
      }
      if (params.status && params.status.length) {
        q = q.in("status", params.status);
      }
      if (params.from) q = q.gte("placed_at", params.from.toISOString());
      if (params.to) q = q.lte("placed_at", params.to.toISOString());

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as (OrderRow & { order_items: OrderItemRow[] })[];
    },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === "delivered") patch.delivered_at = new Date().toISOString();
      if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

/* ---------- Sales aggregate ---------- */

export const useSales = (range: "today" | "week" | "month") => {
  const { sellerProfile } = useSellerAuth();
  return useQuery({
    queryKey: ["sales", sellerProfile?.id, range],
    enabled: !!sellerProfile?.id,
    queryFn: async () => {
      const now = new Date();
      const from = new Date(now);
      if (range === "today") from.setHours(0, 0, 0, 0);
      else if (range === "week") from.setDate(now.getDate() - 7);
      else from.setMonth(now.getMonth() - 1);

      const { data, error } = await supabase
        .from("orders")
        .select("total, placed_at, status, order_items(name, quantity, line_total, menu_item_id)")
        .eq("seller_id", sellerProfile!.id)
        .gte("placed_at", from.toISOString())
        .eq("status", "delivered");

      if (error) throw error;
      const orders = data ?? [];
      const totalSales = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
      const orderCount = orders.length;
      // Item aggregates
      const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
      orders.forEach((o: any) =>
        (o.order_items ?? []).forEach((it: any) => {
          const existing = itemMap.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
          existing.qty += Number(it.quantity ?? 0);
          existing.revenue += Number(it.line_total ?? 0);
          itemMap.set(it.name, existing);
        })
      );
      const items = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);
      const topItem = items[0]?.name ?? null;
      // Peak hour
      const hourMap = new Map<number, number>();
      orders.forEach((o: any) => {
        const h = new Date(o.placed_at).getHours();
        hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
      });
      let peakHour: number | null = null;
      let peakCount = 0;
      hourMap.forEach((c, h) => {
        if (c > peakCount) {
          peakCount = c;
          peakHour = h;
        }
      });
      // Hourly sales for chart
      const hourly: { time: string; value: number }[] = [];
      for (let h = 8; h <= 20; h += 2) {
        const v = orders
          .filter((o: any) => {
            const oh = new Date(o.placed_at).getHours();
            return oh >= h && oh < h + 2;
          })
          .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
        const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}`;
        hourly.push({ time: label, value: v });
      }
      return { totalSales, orderCount, topItem, peakHour, items, hourly };
    },
  });
};