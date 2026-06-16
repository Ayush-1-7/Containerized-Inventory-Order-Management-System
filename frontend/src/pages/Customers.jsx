import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, Plus, Trash2, Mail, Phone } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { SearchInput } from "../components/ui/SearchInput";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { CustomerFormModal } from "../components/customers/CustomerFormModal";
import { useCustomers, useDeleteCustomer } from "../lib/queries";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../lib/api";
import { formatDate, initials } from "../lib/utils";

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();
  const del = useDeleteCustomer();

  const { data, isPending, isError, refetch } = useCustomers({ page_size: 200 });
  const customers = data?.items ?? [];

  useEffect(() => {
    if (params.get("new") === "1") {
      setFormOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const onDelete = async () => {
    try {
      await del.mutateAsync(deleting.id);
      toast({ variant: "success", title: "Customer deleted", description: deleting.full_name });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "error", title: "Could not delete", description: getErrorMessage(err) });
    }
  };

  const columns = [
    {
      key: "full_name",
      header: "Customer",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
            {initials(c.full_name)}
          </div>
          <span className="font-medium">{c.full_name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (c) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3.5 w-3.5" /> {c.email}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) =>
        c.phone ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> {c.phone}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "created_at",
      header: "Added",
      sortable: true,
      accessor: (c) => c.created_at,
      render: (c) => <span className="text-muted-foreground">{formatDate(c.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleting(c)}
          aria-label="Delete"
          className="hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Your customer directory."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New customer
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email…"
          className="sm:max-w-xs"
        />
        {!isError && (
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} of {customers.length}
          </span>
        )}
      </div>

      {isPending ? (
        <SkeletonTable rows={6} cols={5} />
      ) : isError ? (
        <ErrorState title="Couldn't load customers" onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={
            <EmptyState
              icon={Users}
              title={search ? "No matching customers" : "No customers yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Add your first customer to start creating orders."
              }
              action={
                !search ? (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" /> New customer
                  </Button>
                ) : null
              }
            />
          }
        />
      )}

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        loading={del.isPending}
        title="Delete customer?"
        description={`“${deleting?.full_name}” will be permanently removed.`}
      />
    </div>
  );
}
