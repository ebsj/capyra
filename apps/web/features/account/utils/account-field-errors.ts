import { ApiError } from "../api/account-api";

export type FieldErrors = Record<string, string>;

export function resolveAccountFieldErrors(error: unknown) {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) {
    return {};
  }

  return error.fieldErrors.reduce<FieldErrors>((accumulator, fieldError) => {
    accumulator[fieldError.field] = fieldError.message;
    return accumulator;
  }, {});
}
