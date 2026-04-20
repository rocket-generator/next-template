export function parseBooleanEnv(name: string): boolean | undefined;
export function parseBooleanEnv(name: string, defaultValue: boolean): boolean;
export function parseBooleanEnv(
  name: string,
  defaultValue?: boolean
): boolean | undefined {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }

  throw new Error(
    `Invalid boolean environment variable ${name}: expected "true" or "false"`
  );
}
