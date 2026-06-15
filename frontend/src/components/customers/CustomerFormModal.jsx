import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Field } from "../ui/Input";
import { useCreateCustomer } from "../../lib/queries";
import { useToast } from "../ui/Toast";
import { getErrorMessage } from "../../lib/api";

const EMPTY = { full_name: "", email: "", phone: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerFormModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const create = useCreateCustomer();

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await create.mutateAsync({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      });
      toast({ variant: "success", title: "Customer added", description: form.full_name });
      onClose();
    } catch (err) {
      toast({ variant: "error", title: "Could not add customer", description: getErrorMessage(err) });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New customer"
      description="Add a customer to your directory."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending}>
            Add customer
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Full name" htmlFor="c-name" error={errors.full_name} required>
          <Input id="c-name" value={form.full_name} onChange={set("full_name")} invalid={!!errors.full_name} placeholder="e.g. Ava Thompson" />
        </Field>
        <Field label="Email address" htmlFor="c-email" error={errors.email} hint="Must be unique." required>
          <Input id="c-email" type="email" value={form.email} onChange={set("email")} invalid={!!errors.email} placeholder="name@company.com" />
        </Field>
        <Field label="Phone" htmlFor="c-phone">
          <Input id="c-phone" value={form.phone} onChange={set("phone")} placeholder="+1 202 555 0118" />
        </Field>
      </form>
    </Modal>
  );
}
