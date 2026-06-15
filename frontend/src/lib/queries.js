import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/* ----------------------------- Products ----------------------------- */
export function useProducts(params = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get("/products", { params })).data,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/products", payload)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      (await api.put(`/products/${id}`, payload)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

/* ----------------------------- Customers ---------------------------- */
export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => (await api.get("/customers", { params })).data,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/customers", payload)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/customers/${id}`)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

/* ------------------------------ Orders ------------------------------ */
export function useOrders(params = {}) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => (await api.get("/orders", { params })).data,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/orders", payload)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/orders/${id}`)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

/* ---------------------------- Dashboard ----------------------------- */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/stats")).data,
  });
}

function invalidateAll(qc) {
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["customers"] });
  qc.invalidateQueries({ queryKey: ["orders"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}
