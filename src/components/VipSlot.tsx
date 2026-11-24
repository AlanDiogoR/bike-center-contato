"use client";

import dynamic from "next/dynamic";

/** Carregado só quando a flag VIP está ligada (ver LinksSection). */
const VipSlot = dynamic(() => import("@/components/VipEntry"), { ssr: true });

export default VipSlot;
