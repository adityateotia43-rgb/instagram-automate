import { z } from "zod";

/**
 * Zod schema for Instagram Graph API configuration.
 */
export const instagramEnvSchema = z.object({
  INSTAGRAM_ACCESS_TOKEN: z.string().min(1, {
    message: "INSTAGRAM_ACCESS_TOKEN is required. Set this in your .env file.",
  }),
  META_APP_ID: z.string().min(1, {
    message: "META_APP_ID is required (default: ).",
  }).default(""),
  META_APP_SECRET: z.string().min(1, {
    message: "META_APP_SECRET is required for token verification and webhook signatures.",
  }),
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: z.string().min(1, {
    message: "INSTAGRAM_WEBHOOK_VERIFY_TOKEN is required for Meta webhook challenge verification.",
  }),
  GRAPH_API_VERSION: z.string().default("v21.0"),
  DEMO_MODE: z.string().optional().default("false"),
});

export type InstagramEnv = z.infer<typeof instagramEnvSchema>;

export interface InstagramConfig {
  accessToken: string;
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
  graphApiVersion: string;
  facebookGraphBaseUrl: string;
  instagramGraphBaseUrl: string;
  isDemoMode: boolean;
}

export class InstagramConfigError extends Error {
  public missingKeys: string[];

  constructor(message: string, missingKeys: string[] = []) {
    super(message);
    this.name = "InstagramConfigError";
    this.missingKeys = missingKeys;
  }
}

/**
 * Loads and validates Instagram API configuration from environment variables.
 * 
 * @param options.strict - When true, throws an InstagramConfigError if any required variable is missing.
 *                         When false, returns partial config with available values.
 */
export function getInstagramConfig(options: { strict?: boolean } = {}): InstagramConfig {
  const { strict = true } = options;

  const rawEnv = {
    INSTAGRAM_ACCESS_TOKEN:
      process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_TEST_ACCESS_TOKEN || "",
    META_APP_ID: process.env.META_APP_ID || "",
    META_APP_SECRET: process.env.META_APP_SECRET || "",
    INSTAGRAM_WEBHOOK_VERIFY_TOKEN: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "",
    GRAPH_API_VERSION: process.env.GRAPH_API_VERSION || "v21.0",
    DEMO_MODE: process.env.DEMO_MODE || "false",
  };

  const isDemo = rawEnv.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (strict && !isDemo) {
    const result = instagramEnvSchema.safeParse(rawEnv);
    if (!result.success) {
      const missingKeys = result.error.issues.map((issue) => issue.path.join("."));
      const messages = result.error.issues.map((issue) => ` - ${issue.message}`).join("\n");
      
      throw new InstagramConfigError(
        `[InstagramConfig] Missing required Instagram API configuration:\n${messages}\n\nPlease check your .env file.`,
        missingKeys
      );
    }
  }

  const version = rawEnv.GRAPH_API_VERSION || "v21.0";
  // Normalize version string to start with 'v'
  const normalizedVersion = version.startsWith("v") ? version : `v${version}`;

  return {
    accessToken: rawEnv.INSTAGRAM_ACCESS_TOKEN,
    appId: rawEnv.META_APP_ID,
    appSecret: rawEnv.META_APP_SECRET,
    webhookVerifyToken: rawEnv.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
    graphApiVersion: normalizedVersion,
    facebookGraphBaseUrl: `https://graph.facebook.com/${normalizedVersion}`,
    instagramGraphBaseUrl: `https://graph.instagram.com/${normalizedVersion}`,
    isDemoMode: isDemo,
  };
}

/**
 * Validates whether the required environment variables are present without throwing.
 */
export function checkInstagramConfigStatus(): {
  isConfigured: boolean;
  missingVariables: string[];
  isDemo: boolean;
} {
  const missingVariables: string[] = [];
  const hasToken =
    Boolean(process.env.INSTAGRAM_ACCESS_TOKEN) ||
    Boolean(process.env.INSTAGRAM_TEST_ACCESS_TOKEN);
  if (!hasToken) missingVariables.push("INSTAGRAM_ACCESS_TOKEN");
  if (!process.env.META_APP_ID) missingVariables.push("META_APP_ID");
  if (!process.env.META_APP_SECRET) missingVariables.push("META_APP_SECRET");
  if (!process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) missingVariables.push("INSTAGRAM_WEBHOOK_VERIFY_TOKEN");

  const isDemo = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return {
    isConfigured: missingVariables.length === 0,
    missingVariables,
    isDemo,
  };
}
