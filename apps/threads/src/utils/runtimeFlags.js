const demoContentFlag = String(import.meta.env.VITE_ENABLE_THREADS_DEMO_CONTENT || "").trim().toLowerCase();

export const SHOW_THREADS_DEMO_CONTENT =
  import.meta.env.DEV && (demoContentFlag === "1" || demoContentFlag === "true" || demoContentFlag === "yes");
