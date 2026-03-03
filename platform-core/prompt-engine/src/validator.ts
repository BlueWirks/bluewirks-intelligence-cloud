import Ajv from "ajv";
import type { PromptConfig } from "./types.js";

const ajv = new Ajv({ allErrors: true });

/**
 * Validates generated output against the prompt's JSON schema.
 * Returns { valid, errors } — errors is null if valid.
 */
export function validateOutput(
  output: unknown,
  promptConfig: PromptConfig
): { valid: boolean; errors: string | null } {
  const validate = ajv.compile(promptConfig.outputSchema);
  const valid = validate(output);

  if (!valid) {
    const errors = validate.errors
      ?.map((e) => `${e.instancePath} ${e.message}`)
      .join("; ") || "Unknown validation error";
    return { valid: false, errors };
  }

  return { valid: true, errors: null };
}
