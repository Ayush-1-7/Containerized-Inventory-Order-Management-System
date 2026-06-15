import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Field } from "../ui/Input";
import { useCreateProduct, useUpdateProduct } from "../../lib/queries";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../lib/api";

const EMPTY = { name: "", sku: "", price: "", quantity_in_stock: "" };

export function ProductFormModal({ open, onClose, product }) {
  const isEdit = !!product;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              sku: product.sku,
              price: String(product.price),
              quantity_in_stock: String(product.quantity_in_stock),
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [open, product]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.sku.trim()) e.sku = "SKU is required.";
    if (form.price === "" || Number(form.price) < 0)
      e.price = "Enter a valid price (≥ 0).";
    if (
      form.quantity_in_stock === "" ||
      !Number.isInteger(Number(form.quantity_in_stock)) ||
      Number(form.quantity_in_stock) < 0
    )
      e.quantity_in_stock = "Enter a whole number (≥ 0).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: product.id, ...payload });
        toast({ variant: "success", title: "Product updated", description: payload.name });
      } else {
        await create.mutateAsync(payload);
        toast({ variant: "success", title: "Product created", description: payload.name });
      }
      onClose();
    } catch (err) {
      toast({ variant: "error", title: "Could not save product", description: getErrorMessage(err) });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit product" : "New product"}
      description={isEdit ? "Update product details and stock." : "Add a product to your catalog."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={saving}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Product name" htmlFor="p-name" error={errors.name} required>
          <Input id="p-name" value={form.name} onChange={set("name")} invalid={!!errors.name} placeholder="e.g. Mechanical Keyboard K8" />
        </Field>
        <Field label="SKU / code" htmlFor="p-sku" error={errors.sku} hint="Must be unique across all products." required>
          <Input id="p-sku" value={form.sku} onChange={set("sku")} invalid={!!errors.sku} placeholder="e.g. KBD-MEC-K8" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)" htmlFor="p-price" error={errors.price} required>
            <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} invalid={!!errors.price} placeholder="0.00" />
          </Field>
          <Field label="Stock quantity" htmlFor="p-qty" error={errors.quantity_in_stock} required>
            <Input id="p-qty" type="number" min="0" step="1" value={form.quantity_in_stock} onChange={set("quantity_in_stock")} invalid={!!errors.quantity_in_stock} placeholder="0" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
