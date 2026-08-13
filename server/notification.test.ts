import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyOwner } from "./_core/notification";

describe("notifyOwner", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns false when the upstream request aborts on timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    }));

    const resultPromise = notifyOwner({ title: "Teste", content: "Timeout controlado" });
    await vi.advanceTimersByTimeAsync(5000);

    await expect(resultPromise).resolves.toBe(false);
  });
});

