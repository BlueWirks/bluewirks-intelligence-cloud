import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { PromptConfig } from "./types.js";

const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "prompts");

/**
 * Loads a prompt configuration by promptId.
 */
export function loadPrompt(promptId: string): PromptConfig {
  const filePath = join(PROMPTS_DIR, `${promptId}.json`);
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as PromptConfig;
  } catch {
    throw new Error(`Prompt not found: ${promptId}`);
  }
}

/**
 * Lists all available prompt configurations.
 */
export function listPrompts(): PromptConfig[] {
  const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = readFileSync(join(PROMPTS_DIR, f), "utf-8");
    return JSON.parse(raw) as PromptConfig;
  });
}
