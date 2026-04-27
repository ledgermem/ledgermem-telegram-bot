import { describe, it, expect, vi } from "vitest";
import {
  handleRemember,
  handleRecall,
  handleForget,
  handleForwardCapture,
  type MemoryClient,
} from "./handlers.js";

function makeMemory(overrides: Partial<MemoryClient> = {}): MemoryClient {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as MemoryClient;
}

describe("handleRemember", () => {
  it("rejects empty", async () => {
    const m = makeMemory();
    const r = await handleRemember({
      text: "",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(r).toContain("Usage");
  });

  it("saves with telegram metadata", async () => {
    const m = makeMemory();
    await handleRemember({
      text: "hi",
      chatId: "111",
      userId: "222",
      memory: m,
    });
    expect(m.add).toHaveBeenCalledWith("hi", {
      metadata: { source: "telegram", threadId: "111", userId: "222" },
    });
  });
});

describe("handleRecall", () => {
  it("returns no-match string", async () => {
    const m = makeMemory({ search: vi.fn().mockResolvedValue([]) });
    const r = await handleRecall({
      text: "x",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(r).toContain("No matches");
  });

  it("uses limit 3 and formats hits", async () => {
    const m = makeMemory({
      search: vi.fn().mockResolvedValue([
        { id: "a", content: "one", score: 0.9 },
        { id: "b", content: "two", score: 0.5 },
      ]),
    });
    const r = await handleRecall({
      text: "x",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(m.search).toHaveBeenCalledWith("x", { limit: 3 });
    expect(r).toContain("one");
    expect(r).toContain("id: a");
  });
});

describe("handleForget", () => {
  it("rejects empty id", async () => {
    const m = makeMemory();
    const r = await handleForget({
      text: "",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(r).toContain("Usage");
  });

  it("calls delete", async () => {
    const m = makeMemory();
    await handleForget({
      text: "id1",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(m.delete).toHaveBeenCalledWith("id1");
  });
});

describe("handleForwardCapture", () => {
  it("ignores empty forwards", async () => {
    const m = makeMemory();
    const r = await handleForwardCapture({
      text: "  ",
      chatId: "1",
      userId: "2",
      memory: m,
    });
    expect(r).toBeNull();
    expect(m.add).not.toHaveBeenCalled();
  });

  it("saves forwarded text with telegram-forward source", async () => {
    const m = makeMemory();
    const r = await handleForwardCapture({
      text: "shared note",
      chatId: "C",
      userId: "U",
      forwardedFrom: "channel:99",
      memory: m,
    });
    expect(r).toContain("Forwarded");
    expect(m.add).toHaveBeenCalledWith("shared note", {
      metadata: {
        source: "telegram-forward",
        threadId: "C",
        userId: "U",
        forwardedFrom: "channel:99",
      },
    });
  });
});
