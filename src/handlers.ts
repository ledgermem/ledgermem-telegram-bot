import type { LedgerMem } from "@ledgermem/memory";

export interface MemoryClient {
  search: LedgerMem["search"];
  add: LedgerMem["add"];
  delete?: (id: string) => Promise<void>;
}

export interface SearchHit {
  id: string;
  content: string;
  score?: number;
}

export interface CommandContext {
  text: string;
  chatId: string;
  userId: string;
  memory: MemoryClient;
}

const TOP_K = 3;

export async function handleRemember(ctx: CommandContext): Promise<string> {
  const content = ctx.text.trim();
  if (!content) return "Usage: /remember <text>";
  await ctx.memory.add(content, {
    metadata: {
      source: "telegram",
      threadId: ctx.chatId,
      userId: ctx.userId,
    },
  });
  return "Saved to memory.";
}

export async function handleRecall(ctx: CommandContext): Promise<string> {
  const query = ctx.text.trim();
  if (!query) return "Usage: /recall <query>";
  const hits = (await ctx.memory.search(query, { limit: TOP_K })) as SearchHit[];
  if (!hits || hits.length === 0) return `No matches for "${query}".`;
  const lines = hits.map(
    (h, i) =>
      `${i + 1}. ${h.content}${h.score !== undefined ? ` (${h.score.toFixed(2)})` : ""}\n   id: ${h.id}`,
  );
  return `Top ${hits.length} matches for "${query}":\n${lines.join("\n")}`;
}

export async function handleForget(ctx: CommandContext): Promise<string> {
  const id = ctx.text.trim();
  if (!id) return "Usage: /forget <id>";
  if (typeof ctx.memory.delete !== "function") {
    return "Delete is not supported by this LedgerMem client version.";
  }
  await ctx.memory.delete(id);
  return `Forgot memory ${id}.`;
}

export interface ForwardContext {
  text: string;
  chatId: string;
  userId: string;
  forwardedFrom?: string;
  memory: MemoryClient;
}

export async function handleForwardCapture(
  ctx: ForwardContext,
): Promise<string | null> {
  const content = ctx.text.trim();
  if (!content) return null;
  await ctx.memory.add(content, {
    metadata: {
      source: "telegram-forward",
      threadId: ctx.chatId,
      userId: ctx.userId,
      forwardedFrom: ctx.forwardedFrom,
    },
  });
  return "Forwarded message saved to memory.";
}
