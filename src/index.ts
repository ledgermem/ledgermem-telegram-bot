import "dotenv/config";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { LedgerMem } from "@ledgermem/memory";
import { loadConfig } from "./config.js";
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

  bot.command("remember", async (ctx) => {
    const reply = await handleRemember({
      text: argText(ctx.message.text, "remember"),
      chatId: String(ctx.chat.id),
      userId: String(ctx.from.id),
      memory,
    });
    await ctx.reply(reply);
  });

  bot.command("recall", async (ctx) => {
    const reply = await handleRecall({
      text: argText(ctx.message.text, "recall"),
      chatId: String(ctx.chat.id),
      userId: String(ctx.from.id),
      memory,
    });
    await ctx.reply(reply);
  });

  bot.command("forget", async (ctx) => {
    const reply = await handleForget({
      text: argText(ctx.message.text, "forget"),
      chatId: String(ctx.chat.id),
      userId: String(ctx.from.id),
      memory,
    });
    await ctx.reply(reply);
  });

  bot.on(message("text"), async (ctx) => {
    const msg = ctx.message;
    if (msg.text.startsWith("/")) return;
    const fwd = msg.forward_origin;
    if (!fwd) return;
    let forwardedFrom = "unknown";
    if (fwd.type === "user") forwardedFrom = `user:${fwd.sender_user.id}`;
    else if (fwd.type === "channel")
      forwardedFrom = `channel:${fwd.chat.id}`;
    else if (fwd.type === "chat") forwardedFrom = `chat:${fwd.sender_chat.id}`;
    else if (fwd.type === "hidden_user")
      forwardedFrom = `hidden:${fwd.sender_user_name}`;

    const reply = await handleForwardCapture({
      text: msg.text,
      chatId: String(ctx.chat.id),
      userId: String(ctx.from.id),
      forwardedFrom,
      memory,
    });
    if (reply) await ctx.reply(reply);
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
