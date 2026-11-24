"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const VipForm = dynamic(() => import("./VipForm"), {
  ssr: false,
  loading: () => (
    <div
      data-testid="vip-form-placeholder"
      aria-busy="true"
      className="mt-3 min-h-[420px] rounded-2xl border border-[#ead7b8] bg-white p-5"
    />
  ),
});

const VIP_PANEL_ID = "vip-form-panel";

export function VipEntry() {
  const [open, setOpen] = useState(false);

  return (
    <div data-placa="hide">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? VIP_PANEL_ID : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="cta-card min-h-14 w-full"
      >
        <span className="flex-1 leading-snug">
          Quero ofertas VIP no WhatsApp
        </span>
      </button>
      {open ? (
        <div id={VIP_PANEL_ID}>
          <VipForm />
        </div>
      ) : null}
    </div>
  );
}

export default VipEntry;
