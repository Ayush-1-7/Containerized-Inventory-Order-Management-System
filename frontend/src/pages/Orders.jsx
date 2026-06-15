import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShoppingCart, Plus, Trash2, Eye } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { OrderCreateModal } from "../components/orders/OrderCreateModal";
import { OrderDetailModal } from "../components/orders/OrderDetailModal";
import { useDeleteOrder, useOrders } from "../lib/queries";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../lib/api";
import { formatCurrency, formatDateTime, shortId } from "../lib/utils";

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();
  const del = useDeleteOrder();

  const { data, isLoading } = useOrders({ page_size: 200 });
  const orders = data?.items ?? [];

  useEffect(() => {
    if (params.get("new") === "1") {
      setCreateOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const onDelete = async () => {
    try {
      await del.mutateAsync(deleting.id);
      toast({
        variant: "success",
        title: "Order cancelled",
        description: `#${shortId(deleting.id)} — stock returned to inventory`,
      });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "error", title: "Could not cancel", description: getErrorMessage(err) });
    }
  };

  const columns = [
    {
      key: "id",
      header: "Order",
      render: (o) => <span className="font-mono text-xs">#{shortId(o.id)}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      accessor: (o) => o.customer?.full_name,
      render: (o) => (
        <div>
          <p className="font-medium">{o.customer?.full_name}</p>
          <p className="text-xs text-muted-foreground">{o.customer?.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      render: (o) => <Badge variant="outline">{o.items.length}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Badge variant={o.status === "confirmed" ? "success" : "default"} dot>
          {o.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      accessor: (o) => o.created_at,
      render: (o) => <span className="text-muted-foreground">{formatDateTime(o.created_at)}</span>,
    },
    {
      key: "total_amount",
      header: "Total",
      sortable: true,
      align: "right",
      accessor: (o) => Number(o.total_amount),
      render: (o) => <span className="font-semibold tabular-nums">{formatCurrency(o.total_amount)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewId(o.id)} aria-label="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleting(o)}
            aria-label="Cancel order"
            className="hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Track and manage customer orders."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New order
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          onRowClick={(o) => setViewId(o.id)}
          emptyState={
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Create an order to automatically reserve stock and compute totals."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> New order
                </Button>
              }
            />
          }
        />
      )}

      <OrderCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <OrderDetailModal orderId={viewId} open={!!viewId} onClose={() => setViewId(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={del.isPending}
        title="Cancel this order?"
        description={`Order #${deleting ? shortId(deleting.id) : ""} will be deleted and its stock returned to inventory.`}
        confirmLabel="Cancel order"
      />
    </div>
  );
}
