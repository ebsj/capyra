import { schemas } from "@capyra/contracts/validators";

interface ContractSchema {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { issues: Array<{ path: Array<string | number>; message: string }> } };
}

export { schemas as contractSchemas };

export function contractErrors(schema: ContractSchema, value: unknown): Array<{ field: string; message: string }> {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message }));
}
