import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SOURCE_EXTENSIONS = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);
const INVALID_CUSTOM_PROPERTY_CLASS =
  /(?:^|[\s"'`])!?[A-Za-z0-9_:/!.[\]=()-]+-\[--[A-Za-z0-9_-]+\]/g;

const collectSourceFiles = (directory: string): string[] => {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    const extension = path.slice(path.lastIndexOf("."));
    return SOURCE_EXTENSIONS.has(extension) ? [path] : [];
  });
};

describe("Tailwind custom property classes", () => {
  it("should use Tailwind v4 custom property syntax", () => {
    const matches = collectSourceFiles(join(process.cwd(), "src")).flatMap(
      (filePath) => {
        const source = readFileSync(filePath, "utf8");
        return Array.from(
          source.matchAll(INVALID_CUSTOM_PROPERTY_CLASS),
          ([match]) => `${filePath}: ${match.trim()}`
        );
      }
    );

    expect(matches).toEqual([]);
  });
});
