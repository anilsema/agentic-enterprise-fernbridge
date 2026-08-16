import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { existsSync } from "fs";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), "../.env.local");
if (!existsSync(envPath)) throw new Error(`Could not find .env.local at ${envPath}.`);
dotenv.config({ path: envPath });

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    `.env.local was found but ANTHROPIC_API_KEY is not set inside it. Add it before using agent3's real API call.`
  );
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Real-cost Claude Haiku 4.5 pricing, current as of build (August 2026).
 * $1.00 / million input tokens, $5.00 / million output tokens.
 * Verify against https://docs.claude.com if this file is revisited later,
 * pricing changes over time and this constant will silently go stale.
 */
const HAIKU_PRICE_PER_INPUT_TOKEN = 1.0 / 1_000_000;
const HAIKU_PRICE_PER_OUTPUT_TOKEN = 5.0 / 1_000_000;

// Hard bounds — these exist specifically so a single call's WORST CASE cost
// is known and small before checkBudget() is ever asked to approve it.
const MAX_OUTPUT_TOKENS = 200;
const MAX_TOPIC_INPUT_LENGTH = 100; // characters, truncates anything longer

/**
 * Conservative worst-case cost estimate for the pre-call budget check.
 * Assumes a generous 500 input tokens (system prompt + short user topic,
 * this use case never needs anywhere near that) and the full output cap.
 * Real measured cost after the call is almost always well below this.
 */
export const WORST_CASE_ESTIMATED_COST =
  500 * HAIKU_PRICE_PER_INPUT_TOKEN + MAX_OUTPUT_TOKENS * HAIKU_PRICE_PER_OUTPUT_TOKEN;

export interface ClaudeGuidanceResult {
  guidance: string;
  inputTokens: number;
  outputTokens: number;
  actualCostUsd: number;
}

const SYSTEM_PROMPT = `You are a governance-constrained AI assistant embedded in a fictitious membership association's AdviceLine system, part of a public portfolio demonstration of AI governance architecture. This is a demo, not a real advisory service, no real member relies on this output.

Given a short employment-relations topic keyword, provide brief, cautious guidance (2-3 sentences maximum) in the style of a first-pass AdviceLine response: name the general risk area, and explicitly recommend escalation to Legal Counsel for any case-specific application. Do not provide detailed legal advice or case-specific reasoning. Keep the response short, this is a bounded demo call, not a full consultation.`;

/**
 * Real Claude API call for Agent 3's execution step. Deliberately the only
 * live model call in this whole build, everything else (Agent 1, Agent 2)
 * uses simulated task logic, see harness README for why.
 */
export async function getAdviceLineGuidanceFromClaude(topicKeyword: string): Promise<ClaudeGuidanceResult> {
  const boundedTopic = topicKeyword.slice(0, MAX_TOPIC_INPUT_LENGTH);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Topic: ${boundedTopic}` }],
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const actualCostUsd =
    inputTokens * HAIKU_PRICE_PER_INPUT_TOKEN + outputTokens * HAIKU_PRICE_PER_OUTPUT_TOKEN;

  const textBlock = response.content.find((block) => block.type === "text");
  const guidance = textBlock && "text" in textBlock ? textBlock.text : "(no text response returned)";

  return { guidance, inputTokens, outputTokens, actualCostUsd };
}
