import "dotenv/config";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { LedgerMem } from "@ledgermem/memory";
import { loadConfig, isChatAllowed } from "./config.js";
import {
  handleRemember,
  handleRecall,
  handleForget,
  handleForwardCapture,
} from "./handlers.js";

function argText(text: string, command: string): string {
  const stripped = text.replace(new RegExp(`^/${command}(@\\S+)?\\s*`), "");
  return stripped;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const memory = new LedgerMem({
    apiKey: cfg.ledgermemApiKey,
    workspaceId: cfg.ledgermemWorkspaceId,
  });

  const bot = new Telegraf(cfg.telegramBotToken);

  // Dedup updates so Telegram retries (HTTP errors / restarts) can't double
  // ingest the same message.
  const seenUpdates = new Set<number>();
  const SEEN_MAX = 5000;
  const isDuplicate = (updateId: number): boolean => {
    if (seenUpdates.has(updateId)) return true;
    seenUpdates.add(updateId);
    if (seenUpdates.size > SEEN_MAX) {
      const oldest = seenUpdates.values().next().value;
      if (oldest !== undefined) seenUpdates.delete(oldest);
    }
    return false;
  };

  bot.command("remember", async (ctx) => {
    const chatId = String(ctx.chat.id);
    if (!isChatAllowed(chatId, cfg.allowedChatIds)) {
      await ctx.reply("This chat is not authorized to write to memory.");
      return;
    }
    if (isDuplicate(ctx.update.update_id)) return;
    try {
      const reply = await handleRemember({
        text: argText(ctx.message.text, "remember"),
        chatId,
        userId: String(ctx.from.id),
        memory,
      });
      await ctx.reply(reply);
    } catch (err) {
      console.error("/remember failed:", err);
      await ctx.reply("Sorry, something went wrong.");
    }
  });

  bot.command("recall", async (ctx) => {
    const chatId = String(ctx.chat.id);
    if (!isChatAllowed(chatId, cfg.allowedChatIds)) {
      await ctx.reply("This chat is not authorized to read memory.");
      return;
    }
    if (isDuplicate(ctx.update.update_id)) return;
    try {
      const reply = await handleRecall({
        text: argText(ctx.message.text, "recall"),
        chatId,
        userId: String(ctx.from.id),
        memory,
      });
      await ctx.reply(reply);
    } catch (err) {
      console.error("/recall failed:", err);
      await ctx.reply("Sorry, something went wrong.");
    }
  });

  bot.command("forget", async (ctx) => {
    const chatId = String(ctx.chat.id);
    if (!isChatAllowed(chatId, cfg.allowedChatIds)) {
      await ctx.reply("This chat is not authorized to delete memory.");
      return;
    }
    if (isDuplicate(ctx.update.update_id)) return;
    try {
      const reply = await handleForget({
        text: argText(ctx.message.text, "forget"),
        chatId,
        userId: String(ctx.from.id),
        memory,
      });
      await ctx.reply(reply);
    } catch (err) {
      console.error("/forget failed:", err);
      await ctx.reply("Sorry, something went wrong.");
    }
  });

  bot.on(message("text"), async (ctx) => {
    const msg = ctx.message;
    if (msg.text.startsWith("/")) return;
    const fwd = msg.forward_origin;
    if (!fwd) return;
    const chatId = String(ctx.chat.id);
    if (!isChatAllowed(chatId, cfg.allowedChatIds)) return;
    if (isDuplicate(ctx.update.update_id)) return;
    let forwardedFrom = "unknown";
    if (fwd.type === "user") forwardedFrom = `user:${fwd.sender_user.id}`;
    else if (fwd.type === "channel")
      forwardedFrom = `channel:${fwd.chat.id}`;
    else if (fwd.type === "chat") forwardedFrom = `chat:${fwd.sender_chat.id}`;
    else if (fwd.type === "hidden_user")
      forwardedFrom = `hidden:${fwd.sender_user_name}`;

    try {
      const reply = await handleForwardCapture({
        text: msg.text,
        chatId,
        userId: String(ctx.from.id),
        forwardedFrom,
        memory,
      });
      if (reply) await ctx.reply(reply);
    } catch (err) {
      console.error("forward capture failed:", err);
    }
  });

  await bot.launch();
  // eslint-disable-next-line no-console
  console.log("LedgerMem Telegram bot running.");
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal:", err);
  process.exit(1);
});
