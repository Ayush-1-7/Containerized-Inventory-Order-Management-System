import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { useOrder } from "../../lib/queries";
import { formatCurrency, formatDateTime, shortId } from "../../lib/utils";
import { Skeleton } from "../ui/Skeleton";

export function OrderDetailModal({ orderId, open, onClose }) {
  const { data: order, isLoading } = useOrder(orderId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={order ? `Order #${shortId(order.id)}` : "Order details"}
      description={order ? formatDateTime(order.created_at) : undefined}
    >
      {isLoading || !order ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Info label="Customer" value={order.customer?.full_name} />
            <Info label="Email" value={order.customer?.email} />
            <Info
              label="Status"
              value={
                <Badge variant={order.status === "confirmed" ? "success" : "default"} dot>
                  {order.status}
                </Badge>
              }
            />
          </div>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Product</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Unit</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">{it.product_sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(it.unit_price)}</td>
                    <td className="px-4 py-3 text-right">{it.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-surface">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                    Order total
                  </td>
                  <td className="px-4 py-3 text-right text-base font-semibold">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</div>
    </div>
  );
}
