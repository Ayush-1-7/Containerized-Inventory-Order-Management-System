import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    // Explicit config path so Tailwind resolves it regardless of the
    // process working directory (dev server, Docker build, CI, etc.).
    tailwindcss: { config: path.join(dir, "tailwind.config.js") },
    autoprefixer: {},
  },
};
