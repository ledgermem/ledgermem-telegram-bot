export interface BotConfig {
  telegramBotToken: string;
  getmnemoApiKey: string;
  getmnemoWorkspaceId: string;
  // Allowlist of Telegram chat ids permitted to write to memory. Empty set
  // = unrestricted (back-compat for single-user self-hosted setups). Set
  // ALLOWED_CHAT_IDS in any shared deployment.
  allowedChatIds: Set<string>;
}

const REQUIRED = [
  "TELEGRAM_BOT_TOKEN",
  "GETMNEMO_API_KEY",
  "GETMNEMO_WORKSPACE_ID",
] as const;

function loadAllowedChatIds(): Set<string> {
  const raw = process.env.ALLOWED_CHAT_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  );
}

export function loadConfig(): BotConfig {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN as string,
    getmnemoApiKey: process.env.GETMNEMO_API_KEY as string,
    getmnemoWorkspaceId: process.env.GETMNEMO_WORKSPACE_ID as string,
    allowedChatIds: loadAllowedChatIds(),
  };
}

export function isChatAllowed(
  chatId: string,
  allowed: Set<string>,
): boolean {
  if (allowed.size === 0) return true;
  return allowed.has(chatId);
}
