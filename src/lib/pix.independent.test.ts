import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { parseTLV, type TLV } from "pix-qr-code-detail";
import {
  isValidBrCode,
  parseStaticBrCode,
  validateCrc16,
} from "@thiagoprazeres/pix-static-brcode";
import { describe, expect, it } from "vitest";
import { buildPixPayload } from "./pix";

function child(fields: TLV[], tag: string): TLV | undefined {
  return fields.find((field) => field.tag === tag);
}

function decodeJsQr(png: Buffer): string {
  const image = PNG.sync.read(png);
  const code = jsQR(
    new Uint8ClampedArray(image.data.buffer, image.data.byteOffset, image.data.byteLength),
    image.width,
    image.height,
  );
  if (!code) throw new Error("jsQR não leu o QR");
  return code.data;
}

function decodeZbar(png: Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), "pix-qr-"));
  const file = join(dir, "qr.png");
  writeFileSync(file, png);
  return execFileSync("zbarimg", ["-q", "--raw", file], {
    encoding: "utf8",
  }).trim();
}

function expectBrCode(payload: string, amount: string | null) {
  expect(validateCrc16(payload)).toBe(true);
  expect(isValidBrCode(payload)).toBe(true);
  const parsed = parseStaticBrCode(payload);
  expect(parsed.pixKey).toBe("+5514996542733");
  expect(parsed.receiverName).toBe("BIKE CENTER COM BIC LTDA");
  expect(parsed.receiverCity).toBe("FARTURA");
  expect(parsed.description).toBeUndefined();
  if (amount == null) {
    expect(parsed.amount).toBeUndefined();
  } else {
    expect(parsed.amount).toBe(Number(amount));
  }

  const fields = parseTLV(payload);
  expect(child(fields, "01")?.value).toBe("11");
  const merchant = child(fields, "26");
  expect(merchant?.children?.map((item) => item.tag)).toEqual(["00", "01"]);
  expect(child(merchant?.children ?? [], "00")?.value).toBe("br.gov.bcb.pix");
  expect(child(merchant?.children ?? [], "01")?.value).toBe("+5514996542733");
  expect(child(fields, "59")?.value).toBe("BIKE CENTER COM BIC LTDA");
  expect(child(fields, "60")?.value).toBe("FARTURA");
  const extra = child(fields, "62");
  expect(child(extra?.children ?? [], "05")?.value).toBe("***");
  expect(child(fields, "54")?.value).toBe(amount ?? undefined);
  expect(child(fields, "63")?.value).toBe(payload.slice(-4));
  expect(merchant?.children?.some((item) => item.tag === "02")).toBe(false);
}

describe("validador BR Code independente", () => {
  it("aceita o payload sem valor e rejeita CRC adulterado", () => {
    const payload = buildPixPayload(null);
    expectBrCode(payload, null);
    const broken = `${payload.slice(0, -1)}${payload.endsWith("0") ? "1" : "0"}`;
    expect(validateCrc16(broken)).toBe(false);
    expect(() => parseStaticBrCode(broken)).toThrow(/CRC/i);
  });

  it("aceita o payload com R$ 10,00", () => {
    expectBrCode(buildPixPayload("10.00"), "10.00");
  });
});

describe("QR renderizado", () => {
  it.each([
    ["sem valor", null],
    ["com R$ 10,00", "10.00"],
  ] as const)("jsQR e zbar leem o mesmo payload %s", async (_label, amount) => {
    const payload = buildPixPayload(amount);
    const png = await QRCode.toBuffer(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
    });
    expect(decodeJsQr(png)).toBe(payload);
    expect(decodeZbar(png)).toBe(payload);
  });
});
