import { PLACA_BOOTSTRAP_SCRIPT } from "@/lib/placa-bootstrap";

/** Primeiro nó do body: roda antes do HTML da página ser pintado. */
export function PlacaBootstrapScript() {
  return (
    <script
      id="placa-utm"
      dangerouslySetInnerHTML={{ __html: PLACA_BOOTSTRAP_SCRIPT }}
    />
  );
}
