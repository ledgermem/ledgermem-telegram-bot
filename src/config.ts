export interface BotConfig {
  telegramBotToken: string;
  ledgermemApiKey: string;
  ledgermemWorkspaceId: string;
}

const REQUIRED = [
  "TELEGRAM_BOT_TOKEN",
  "LEDGERMEM_API_KEY",
  "LEDGERMEM_WORKSPACE_ID",
] as const;

export function loadConfig(): BotConfig {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN as string,
    ledgermemApiKey: process.env.LEDGERMEM_API_KEY as string,
    ledgermemWorkspaceId: process.env.LEDGERMEM_WORKSPACE_ID as string,
  };
}
