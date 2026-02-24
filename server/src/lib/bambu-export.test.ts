import test from "node:test";
import assert from "node:assert/strict";

import { buildBambuSvgExport } from "./bambu-export";

test("buildBambuSvgExport creates tag svg with expected dimensions and text", async () => {
  const result = await buildBambuSvgExport({
    orderId: "ord_12345678",
    productType: "tag",
    useDefaultDesign: false,
    baseColor: "#111827",
    textColor: "#F8FAFC",
    iconColor: "#F59E0B",
    primaryText: "Tap to connect",
    secondaryText: null,
    iconId: "wifi",
  });

  assert.equal(result.fileName, "taplink-tag-12345678-bambu-v1.svg");
  assert.match(result.svg, /viewBox="0 0 32 32"/);
  assert.match(result.svg, /Tap to connect/);
  assert.match(result.svg, /Icon ID: Wifi/);
  assert.match(result.svg, /id="icon-wifi"/);
  assert.doesNotMatch(result.svg, /id="icon-fallback-token"/);
  assert.match(result.svg, /dot-grid/);
});

test("buildBambuSvgExport creates card svg and includes secondary text", async () => {
  const result = await buildBambuSvgExport({
    orderId: "ord_card_export_87654321",
    productType: "card",
    useDefaultDesign: true,
    baseColor: "#0f172a",
    textColor: "#f8fafc",
    iconColor: "#ea580c",
    primaryText: "Alex Rivera",
    secondaryText: "Digital Card",
    iconId: "briefcase",
  });

  assert.equal(result.fileName, "taplink-card-87654321-bambu-v1.svg");
  assert.match(result.svg, /viewBox="0 0 85.6 54"/);
  assert.match(result.svg, /Alex Rivera/);
  assert.match(result.svg, /Digital Card/);
  assert.match(result.svg, /Icon ID: Briefcase/);
});

test("buildBambuSvgExport normalizes invalid colors to safe defaults", async () => {
  const result = await buildBambuSvgExport({
    orderId: "ord_bad_colors_9999",
    productType: "tag",
    useDefaultDesign: false,
    baseColor: "not-a-color",
    textColor: "also-bad",
    iconColor: "#12345",
    primaryText: "Hello",
    secondaryText: null,
    iconId: "zap",
  });

  assert.match(result.svg, /fill="#111827"/);
  assert.match(result.svg, /fill="#F8FAFC"/);
  assert.match(result.svg, /stroke="#F59E0B"/);
});
