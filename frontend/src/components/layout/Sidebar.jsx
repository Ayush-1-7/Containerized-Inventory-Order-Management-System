import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Boxes,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className="relative h-[18px] w-[18px]" />
              <span className="relative">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Boxes className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">Stockpilot</p>
        <p className="text-[11px] text-muted-foreground">Inventory & Orders</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-surface/60 lg:flex lg:flex-col">
      <Brand />
      <NavItems />
      <div className="mt-auto p-4">
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="text-xs font-medium text-foreground">Quick actions</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Press{" "}
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-sans text-[10px]">
              ⌘K
            </kbd>{" "}
            to open the command menu.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-elevated lg:hidden"
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            onClick={onClose}
            className="mr-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavItems onNavigate={onClose} />
      </motion.aside>
    </>
  );
}
