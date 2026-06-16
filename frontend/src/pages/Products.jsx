import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { SearchInput } from "../components/ui/SearchInput";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProductFormModal } from "../components/products/ProductFormModal";
import { useDeleteProduct, useProducts } from "../lib/queries";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../lib/api";
import { formatCurrency } from "../lib/utils";

const LOW_STOCK = 10;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();
  const del = useDeleteProduct();

  const { data, isPending, isError, refetch } = useProducts({ page_size: 200 });
  const products = data?.items ?? [];

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    let list = products;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    if (lowOnly) list = list.filter((p) => p.quantity_in_stock <= LOW_STOCK);
    return list;
  }, [products, search, lowOnly]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const onDelete = async () => {
    try {
      await del.mutateAsync(deleting.id);
      toast({ variant: "success", title: "Product deleted", description: deleting.name });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "error", title: "Could not delete", description: getErrorMessage(err) });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      align: "right",
      accessor: (p) => Number(p.price),
      render: (p) => <span className="tabular-nums">{formatCurrency(p.price)}</span>,
    },
    {
      key: "quantity_in_stock",
      header: "Stock",
      sortable: true,
      align: "right",
      accessor: (p) => p.quantity_in_stock,
      render: (p) => <StockBadge qty={p.quantity_in_stock} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(p);
              setFormOpen(true);
            }}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleting(p)}
            aria-label="Delete"
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
        title="Products"
        description="Manage your catalog and stock levels."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or SKU…"
          className="sm:max-w-xs"
        />
        <Button
          variant={lowOnly ? "subtle" : "outline"}
          onClick={() => setLowOnly((v) => !v)}
        >
          <Filter className="h-4 w-4" /> Low stock only
        </Button>
        {!isError && (
          <span className="text-sm text-muted-foreground sm:ml-auto">
            {filtered.length} of {products.length}
          </span>
        )}
      </div>

      {isPending ? (
        <SkeletonTable rows={6} cols={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load products" onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={
            <EmptyState
              icon={Package}
              title={search || lowOnly ? "No matching products" : "No products yet"}
              description={
                search || lowOnly
                  ? "Try adjusting your search or filters."
                  : "Add your first product to start tracking inventory."
              }
              action={
                !search && !lowOnly ? (
                  <Button onClick={openNew}>
                    <Plus className="h-4 w-4" /> New product
                  </Button>
                ) : null
              }
            />
          }
        />
      )}

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={del.isPending}
        title="Delete product?"
        description={`“${deleting?.name}” will be permanently removed. This cannot be undone.`}
      />
    </div>
  );
}

function StockBadge({ qty }) {
  if (qty === 0) return <Badge variant="danger">Out of stock</Badge>;
  if (qty <= LOW_STOCK)
    return <Badge variant="warning">{qty} low</Badge>;
  return <Badge variant="success">{qty} in stock</Badge>;
}
