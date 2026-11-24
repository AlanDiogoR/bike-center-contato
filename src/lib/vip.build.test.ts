import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function listJsFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsFilesRecursive(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe.skipIf(!process.env.VIP_BUILD_CHECK)(
  "vCard CRLF no bundle minificado (.next/static/chunks)",
  () => {
    it("preserva escapes \\r\\n sem bytes 0x0A ou 0x0D crus no chunk gerado", () => {
      const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");
      const jsFiles = listJsFilesRecursive(chunksDir);

      let matchedBuffer: Buffer | null = null;
      let startIndex = -1;
      const startMarker = Buffer.from("BEGIN:VCARD", "utf8");
      const endMarker = Buffer.from("END:VCARD", "utf8");

      for (const file of jsFiles) {
        const buf = fs.readFileSync(file);
        const idx = buf.indexOf(startMarker);
        if (idx !== -1) {
          matchedBuffer = buf;
          startIndex = idx;
          break;
        }
      }

      expect(
        matchedBuffer,
        "Chunk contendo BEGIN:VCARD não encontrado em .next/static/chunks/**/*.js",
      ).not.toBeNull();

      const endIndex = matchedBuffer!.indexOf(endMarker, startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);

      const sliceEnd = Math.min(
        matchedBuffer!.length,
        endIndex + endMarker.length + 10,
      );
      const rawSlice = matchedBuffer!.subarray(startIndex, sliceEnd);

      // Não pode conter nenhum byte 0x0A (LF) nem 0x0D (CR) cru
      expect(rawSlice.includes(0x0a)).toBe(false);
      expect(rawSlice.includes(0x0d)).toBe(false);

      const snippet = rawSlice.toString("utf8");

      // \r\n escapado deve aparecer pelo menos 7 vezes (uma por linha)
      const escapedCrlfMatches = snippet.match(/\\r\\n/g) ?? [];
      expect(escapedCrlfMatches.length).toBeGreaterThanOrEqual(7);

      // Nunca há um \n escapado sem \r escapado imediatamente antes
      expect(snippet).not.toMatch(/(?<!\\r)\\n/);
    });
  },
);
