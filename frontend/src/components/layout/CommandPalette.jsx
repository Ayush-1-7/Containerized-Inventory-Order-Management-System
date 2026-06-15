import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Plus,
  Moon,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(
    () => [
      { id: "dash", label: "Go to Dashboard", group: "Navigation", icon: LayoutDashboard, run: () => navigate("/") },
      { id: "prod", label: "Go to Products", group: "Navigation", icon: Package, run: () => navigate("/products") },
      { id: "cust", label: "Go to Customers", group: "Navigation", icon: Users, run: () => navigate("/customers") },
      { id: "ord", label: "Go to Orders", group: "Navigation", icon: ShoppingCart, run: () => navigate("/orders") },
      { id: "new-prod", label: "Create new product", group: "Actions", icon: Plus, run: () => navigate("/products?new=1") },
      { id: "new-cust", label: "Create new customer", group: "Actions", icon: Plus, run: () => navigate("/customers?new=1") },
      { id: "new-ord", label: "Create new order", group: "Actions", icon: Plus, run: () => navigate("/orders?new=1") },
      { id: "theme", label: "Toggle dark / light theme", group: "Actions", icon: Moon, run: () => toggle() },
    ],
    [navigate, toggle]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const runCommand = (cmd) => {
    onClose();
    cmd.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) runCommand(filtered[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border bg-elevated shadow-pop"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results for “{query}”
                </p>
              )}
              {filtered.map((cmd, idx) => {
                const showGroup = cmd.group !== lastGroup;
                lastGroup = cmd.group;
                return (
                  <div key={cmd.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {cmd.group}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => runCommand(cmd)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                        active === idx
                          ? "bg-primary/12 text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <cmd.icon className="h-4 w-4" />
                      <span className="flex-1 text-foreground">{cmd.label}</span>
                      {active === idx && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
