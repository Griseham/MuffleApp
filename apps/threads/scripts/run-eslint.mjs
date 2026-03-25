if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

if (typeof AbortSignal !== "undefined" && typeof AbortSignal.prototype.throwIfAborted !== "function") {
  AbortSignal.prototype.throwIfAborted = function throwIfAborted() {
    if (this.aborted) {
      throw this.reason instanceof Error ? this.reason : new Error(this.reason || "Operation aborted");
    }
  };
}

await import(new URL("../node_modules/eslint/bin/eslint.js", import.meta.url));
