import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

test("FACTURA: modal precargado y descarga JPG", async ({ page, request }) => {
  const tag = stamp();
  const nombre = `Factura UI ${tag}`;
  const revista = `Revista Factura ${tag}`;

  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `F${tag}`,
        telefono: "3001112222",
        direccion: "Dir",
        email: `f${tag}@t.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista,
        precio: 120000,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /descargar factura/i })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "FACTURA", exact: true }),
  ).toBeVisible({ timeout: 10000 });

  await expect(page.getByLabel("Nombre del emisor")).toHaveValue(
    "Mi Negocio S.A.S.",
  );
  await expect(page.getByLabel("Nombre del cliente")).toHaveValue(nombre);
  await expect(page.getByLabel("Cuenta Bancolombia")).toHaveValue(
    "12345678901",
  );
  await expect(page.getByLabel("Celular Nequi")).toHaveValue("300 123 4567");
  await expect(
    page.getByRole("textbox", { name: "Concepto fila 1", exact: true }),
  ).toHaveValue(revista);
  await expect(page.getByTestId("factura-total")).toContainText(/120\.000/);
  await page.screenshot({ path: "e2e/screenshots/24-factura-modal.png" });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: /generar factura/i }).click(),
  ]);

  expect(download).not.toBeNull();
  expect(download?.suggestedFilename()).toMatch(/\.jpg$/i);

  const jpgPath = path.join("e2e", "downloads", `factura-${tag}.jpg`);

  await download?.saveAs(jpgPath);
  const buf = fs.readFileSync(jpgPath);

  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
  expect(buf.length).toBeGreaterThan(20000);
  await page.setContent(
    `<body style="margin:0;background:#888"><img src="data:image/jpeg;base64,${buf.toString("base64")}" style="width:794px;display:block;margin:0 auto"/></body>`,
  );
  await page.screenshot({ path: "e2e/screenshots/27-factura-jpg.png" });

  await request.delete(`${API}/compras/${comp.id}`);
  await request.delete(`${API}/clientes/${cli.id}`);
});

test("FACTURA: valores largos no se cortan", async ({ page, request }) => {
  const tag = stamp();
  const nombre =
    "Cliente Con Nombre Extremadamente Largo Para Probar Corte De Texto En La Factura";
  const revista =
    "Revista Con Nombre Muy Largo Que Deberia Verse Completa En La Tabla De Conceptos";
  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `L${tag}`,
        telefono: "3001112222333444555",
        direccion: "Dir",
        email: `l${tag}@l.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista,
        precio: 123456789,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill("Cliente Con Nombre");
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /descargar factura/i })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "FACTURA", exact: true }),
  ).toBeVisible({ timeout: 10000 });

  const sinDesborde = await page.evaluate(() => {
    const factura = document
      .querySelector('[data-testid="factura-total"]')
      ?.closest('div[class*="max-w"]') as HTMLElement | null;

    if (!factura) return false;
    const campos = Array.from(factura.querySelectorAll("textarea, input"));

    return campos.every((el) => {
      const h = el as HTMLElement;

      return (
        h.scrollWidth <= h.clientWidth + 2 &&
        h.scrollHeight <= h.clientHeight + 4
      );
    });
  });

  expect(sinDesborde).toBe(true);
  await expect(
    page.getByRole("textbox", { name: "Concepto fila 1", exact: true }),
  ).toHaveValue(revista);
  await page.screenshot({ path: "e2e/screenshots/26-factura-larga.png" });

  await request.delete(`${API}/compras/${comp.id}`);
  await request.delete(`${API}/clientes/${cli.id}`);
});
