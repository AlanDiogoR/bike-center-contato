import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";
import { store } from "@/lib/links";

describe("SiteFooter", () => {
  it("expõe NAP em texto: nome, endereço, WhatsApp e cidade", () => {
    render(<SiteFooter />);
    expect(screen.getAllByText(store.name).length).toBeGreaterThan(0);
    expect(screen.getByText(store.address.display)).toBeInTheDocument();
    expect(
      screen.getByText("WhatsApp (14) 99166-7793 · (14) 99632-5919"),
    ).toBeInTheDocument();
    expect(screen.getByText("Fartura/SP")).toBeInTheDocument();
  });
});
