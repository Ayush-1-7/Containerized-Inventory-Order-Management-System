import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Input";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";
import { useCreateOrder, useCustomers, useProducts } from "../../lib/queries";
import { getErrorMessage } from "../../lib/api";
import { cn, formatCurrency } from "../../lib/utils";

export function OrderCreateModal({ open, onClose }) {
  const { toast } = useToast();
  const {
    data: customersData,
    isPending: customersPending,
    isError: customersError,
    refetch: refetchCustomers,
  } = useCustomers({ page_size: 200 });
  const {
    data: productsData,
    isPending: productsPending,
    isError: productsError,
    refetch: refetchProducts,
  } = useProducts({ page_size: 200 });
  const createOrder = useCreateOrder();

  const customers = customersData?.items ?? [];
  const products = productsData?.items ?? [];
  const refsLoading = customersPending || productsPending;
  const refsError = customersError || productsError;
  const noCustomers = !customersPending && !customersError && customers.length === 0;

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([]); // [{ product_id, quantity }]
  const [addId, setAddId] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomerId("");
      setLines([]);
      setAddId("");
      setTouched(false);
    }
  }, [open]);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const addLine = (productId) => {
    if (!productId) return;
    setLines((ls) =>
      ls.find((l) => l.product_id === productId)
        ? ls
        : [...ls, { product_id: productId, quantity: 1 }]
    );
    setAddId("");
  };

  const setQty = (productId, qty) =>
    setLines((ls) =>
      ls.map((l) => (l.product_id === productId ? { ...l, quantity: qty } : l))
    );

  const removeLine = (productId) =>
    setLines((ls) => ls.filter((l) => l.product_id !== productId));

  const enriched = lines.map((l) => {
    const p = productMap[l.product_id];
    const overStock = p ? l.quantity > p.quantity_in_stock : false;
    return { ...l, product: p, overStock, lineTotal: (p?.price ?? 0) * l.quantity };
  });

  const total = enriched.reduce((sum, l) => sum + Number(l.lineTotal), 0);
  const hasStockIssue = enriched.some((l) => l.overStock);
  const canSubmit = customerId && lines.length > 0 && !hasStockIssue;
  const availableToAdd = products.filter(
    (p) => !lines.find((l) => l.product_id === p.id)
  );

  const onSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    try {
      await createOrder.mutateAsync({
        customer_id: customerId,
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
      });
      toast({
        variant: "success",
        title: "Order placed",
        description: `${lines.length} item(s) · ${formatCurrency(total)}`,
      });
      onClose();
    } catch (err) {
      toast({ variant: "error", title: "Order failed", description: getErrorMessage(err) });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Create order"
      description="Select a customer, add products, and place the order."
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total</span>{" "}
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={createOrder.isPending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} loading={createOrder.isPending} disabled={!canSubmit}>
              Place order
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {refsError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              Couldn't load customers or products.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (customersError) refetchCustomers();
                if (productsError) refetchProducts();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {noCustomers && !refsError && (
          <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            You don't have any customers yet — add a customer first to place an order.
          </div>
        )}

        <Field
          label="Customer"
          htmlFor="o-customer"
          required
          error={touched && !customerId ? "Select a customer." : undefined}
        >
          <Select
            id="o-customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            invalid={touched && !customerId}
            disabled={refsLoading || refsError}
          >
            <option value="">
              {customersPending ? "Loading customers…" : "Select a customer…"}
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.email}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium">Add products</p>
          <div className="flex gap-2">
            <Select
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              disabled={refsLoading || refsError}
            >
              <option value="">
                {productsPending ? "Loading products…" : "Choose a product…"}
              </option>
              {availableToAdd.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                  {p.name} · {formatCurrency(p.price)} · {p.quantity_in_stock} in stock
                  {p.quantity_in_stock === 0 ? " (out of stock)" : ""}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => addLine(addId)} disabled={!addId}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
            <ShoppingCart className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No items added yet.</p>
            {touched && (
              <p className="mt-1 text-xs text-danger">Add at least one product.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {enriched.map((l) => (
              <div
                key={l.product_id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-surface p-3",
                  l.overStock && "border-danger/50 bg-danger/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(l.product?.price)} · {l.product?.quantity_in_stock} in stock
                  </p>
                  {l.overStock && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      Only {l.product?.quantity_in_stock} available
                    </p>
                  )}
                </div>

                <div className="flex items-center rounded-lg border">
                  <button
                    onClick={() => setQty(l.product_id, Math.max(1, l.quantity - 1))}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                    disabled={l.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={l.quantity}
                    onChange={(e) =>
                      setQty(l.product_id, Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-8 w-12 border-x bg-transparent text-center text-sm outline-none"
                  />
                  <button
                    onClick={() => setQty(l.product_id, l.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:bg-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="w-24 text-right text-sm font-semibold">
                  {formatCurrency(l.lineTotal)}
                </div>

                <button
                  onClick={() => removeLine(l.product_id)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hasStockIssue && (
          <Badge variant="danger" className="self-start">
            <AlertTriangle className="h-3 w-3" /> Resolve stock issues before placing the order
          </Badge>
        )}
      </div>
    </Modal>
  );
}
