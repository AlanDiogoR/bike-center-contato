/**
 * BR Code estático (EMV QRCPS-MPM) do balcão.
 * O CNPJ fica de fora de propósito — pendente de confirmação.
 * O nome do campo 59 é o do brief: 24 caracteres, sem acento.
 */
export const PIX_GUI = "br.gov.bcb.pix";
export const PIX_KEY = "+5514996542733";
export const PIX_MERCHANT_NAME = "BIKE CENTER COM BIC LTDA";
export const PIX_MERCHANT_CITY = "FARTURA";
export const PIX_TXID = "***";
export const PIX_BUTTON_LABEL = "Pagar com Pix";
export const PIX_BENEFICIARY_LABEL =
  "Beneficiário: Bike Center Comércio de Bicicletas LTDA";
export const PIX_KEY_LABEL = "Chave Pix (telefone): (14) 99654-2733";
export const PIX_HOW_TO_PAY =
  "Abra o app do seu banco > Pix > Pix copia e cola (ou Ler QR) > confira o nome e confirme";
export const PIX_SHARE_LABEL = "Compartilhar / Abrir no app do banco";

const AMOUNT_RE = /^(?:0|[1-9]\d{0,9})\.\d{2}$/;

export type PixAmountState = {
  display: string;
  amount: string | null;
  error: string | null;
};

function tlv(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) {
    throw new Error(`ID EMV inválido: ${id}`);
  }
  if (value.length > 99) {
    throw new Error(`Campo ${id} passa de 99 caracteres`);
  }
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE: polinômio 0x1021, init 0xFFFF, sem reflexão, xorout 0. */
export function crc16CcittFalse(value: string): string {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i += 1) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function assertAmount(amount: string): void {
  if (!AMOUNT_RE.test(amount) || Number(amount) <= 0 || amount.length > 13) {
    throw new Error("Valor Pix inválido");
  }
}

/**
 * Monta o copia e cola. `amount` é "10.00" (ponto, 2 casas) ou null para omitir o campo 54.
 * O CRC cobre o payload inteiro, inclusive o prefixo `6304`.
 */
export function buildPixPayload(amount?: string | null): string {
  if (PIX_MERCHANT_NAME.length !== 24) {
    throw new Error("Campo 59 precisa ter 24 caracteres");
  }
  const merchantAccount = tlv("00", PIX_GUI) + tlv("01", PIX_KEY);
  const parts = [
    tlv("00", "01"),
    tlv("01", "11"),
    tlv("26", merchantAccount),
    tlv("52", "0000"),
    tlv("53", "986"),
  ];
  if (amount != null && amount !== "") {
    assertAmount(amount);
    parts.push(tlv("54", amount));
  }
  parts.push(
    tlv("58", "BR"),
    tlv("59", PIX_MERCHANT_NAME),
    tlv("60", PIX_MERCHANT_CITY),
    tlv("62", tlv("05", PIX_TXID)),
  );
  const body = `${parts.join("")}6304`;
  return `${body}${crc16CcittFalse(body)}`;
}

/** Máscara BRL em centavos: "1000" vira "10,00" e amount "10.00". Vazio omite o valor. */
export function parsePixAmountDigits(raw: string): PixAmountState {
  const clean = raw.replace(/\D/g, "").slice(0, 12);
  if (!clean) {
    return { display: "", amount: null, error: null };
  }
  const cents = Number(clean);
  const padded = clean.padStart(3, "0");
  const whole = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const frac = padded.slice(-2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const display = `${grouped},${frac}`;
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return {
      display,
      amount: null,
      error: "Informe um valor maior que zero ou deixe em branco.",
    };
  }
  const amount = `${whole}.${frac}`;
  if (amount.length > 13) {
    return {
      display,
      amount: null,
      error: "Valor acima do limite do Pix.",
    };
  }
  return { display, amount, error: null };
}
