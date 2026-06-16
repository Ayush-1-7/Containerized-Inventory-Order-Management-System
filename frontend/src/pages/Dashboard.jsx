import { Link } from "react-router-dom";
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  SkeletonCards,
  SkeletonChart,
  SkeletonList,
  SkeletonTable,
} from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useDashboard, useOrders } from "../lib/queries";
import { cn, formatCurrency, formatDateTime, shortId } from "../lib/utils";

const KPIS = [
  { key: "total_products", label: "Total Products", icon: Package, to: "/products", accent: "text-info bg-info/12" },
  { key: "total_customers", label: "Total Customers", icon: Users, to: "/customers", accent: "text-primary bg-primary/12" },
  { key: "total_orders", label: "Total Orders", icon: ShoppingCart, to: "/orders", accent: "text-success bg-success/12" },
  { key: "low_stock_count", label: "Low Stock Items", icon: AlertTriangle, to: "/products", accent: "text-warning bg-warning/12", alert: true },
];

export default function Dashboard() {
  const { data: stats, isPending, isError, refetch } = useDashboard();
  const {
    data: ordersData,
    isPending: ordersPending,
    isError: ordersError,
    refetch: refetchOrders,
  } = useOrders({ page_size: 6 });
  const orders = ordersData?.items ?? [];

  // Derive a simple 7-bucket orders-value trend from recent orders for the chart.
  const chartData = buildTrend(ordersData?.items ?? []);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Dashboard"
        description="A real-time overview of your inventory and orders."
      />

      {isPending ? (
        <SkeletonCards />
      ) : isError ? (
        <ErrorState
          title="Couldn't load dashboard"
          description="We couldn't reach the server to load your stats."
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => {
            const value = stats?.[kpi.key] ?? 0;
            const isAlert = kpi.alert && value > 0;
            return (
              <Link key={kpi.key} to={kpi.to}>
                <Card
                  className={cn(
                    "group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-card",
                    isAlert && "border-warning/40"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.accent)}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
                  {isAlert && (
                    <Badge variant="warning" className="mt-3">
                      Needs attention
                    </Badge>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend chart — spans 2 cols */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-0 sm:p-6 sm:pb-0">
            <div>
              <h3 className="text-base font-semibold">Order value trend</h3>
              <p className="text-sm text-muted-foreground">Recent order activity</p>
            </div>
            {!ordersPending && !ordersError && (
              <Badge variant="success">
                <TrendingUp className="h-3 w-3" /> Live
              </Badge>
            )}
          </div>
          {ordersPending ? (
            <SkeletonChart />
          ) : ordersError ? (
            <ErrorState
              className="m-4 border-0"
              title="Couldn't load trend"
              onRetry={refetchOrders}
            />
          ) : (
            <div className="h-64 w-full p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" width={48} />
                  <RTooltip
                    cursor={{ stroke: "hsl(var(--border))" }}
                    contentStyle={{
                      background: "hsl(var(--elevated))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => [formatCurrency(v), "Value"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#area)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Low stock list */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between p-5 pb-3 sm:p-6 sm:pb-3">
            <h3 className="text-base font-semibold">Low stock</h3>
            <Link to="/products" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex-1 px-3 pb-3">
            {isPending ? (
              <SkeletonList rows={5} />
            ) : isError ? (
              <ErrorState
                className="m-1 border-0 py-8"
                title="Couldn't load stock"
                description=""
                onRetry={refetch}
              />
            ) : (stats?.low_stock_products ?? []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-success/12 text-success">
                  <Package className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">All products are well stocked.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {stats.low_stock_products.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-muted">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge variant={p.quantity_in_stock === 0 ? "danger" : "warning"}>
                      {p.quantity_in_stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between p-5 pb-3 sm:p-6 sm:pb-3">
          <h3 className="text-base font-semibold">Recent orders</h3>
          <Link to="/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {ordersPending ? (
          <div className="p-4">
            <SkeletonTable rows={4} cols={4} />
          </div>
        ) : ordersError ? (
          <ErrorState
            className="m-4 border-0"
            title="Couldn't load orders"
            onRetry={refetchOrders}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            className="m-4 border-0"
            icon={ShoppingCart}
            title="No orders yet"
            description="Orders will appear here as soon as they're placed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-semibold">Order</th>
                  <th className="px-5 py-2.5 text-left font-semibold">Customer</th>
                  <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs">#{shortId(o.id)}</td>
                    <td className="px-5 py-3 font-medium">{o.customer?.full_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCurrency(o.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function buildTrend(orders) {
  if (!orders.length) {
    return Array.from({ length: 7 }, (_, i) => ({ label: `D${i + 1}`, value: 0 }));
  }
  const sorted = [...orders].reverse();
  return sorted.slice(-7).map((o, i) => ({
    label: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: Number(o.total_amount),
  }));
}
