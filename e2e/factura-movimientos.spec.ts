import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function setup(request: any, tag: string, precio = 100000) {
  const nombre = `FacMov ${tag}`;
  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `M${tag}`,
        telefono: "3001112222",
        direccion: "Dir",
        email: `m${tag}@t.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista: `Revista Mov ${tag}`,
        precio,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  return { cli, comp, nombre };
}

async function openFactura(page: any, nombre: string) {
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
}

async function cleanup(request: any, compId: number, cliId: number) {
  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${compId}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${compId}`);
  await request.delete(`${API}/clientes/${cliId}`);
}

test("MOV-1: compra nueva sin abonos, saldo igual al total", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setup(request, tag);

  await openFactura(page, nombre);
  await expect(page.getByRole("dialog").getByText(/Abono —/)).toBeHidden({
    timeout: 10000,
  });
  await expect(page.getByTestId("factura-total")).toContainText(/100\.000/);
  await expect(page.getByTestId("factura-estado")).toContainText("PENDIENTE");
  await page.screenshot({ path: "e2e/screenshots/40-mov-sin-abonos.png" });

  await request.delete(`${API}/compras/${comp.id}`);
  await request.delete(`${API}/clientes/${cli.id}`);
});

test("MOV-2: abono parcial aparece y el saldo baja", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setup(request, tag);
  const ab = await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 30000,
      date: new Date().toISOString(),
    },
  });

  expect(ab.status()).toBe(200);

  await openFactura(page, nombre);
  const dialog = page.getByRole("dialog");

  await expect(dialog.getByText(/Abono —/)).toBeVisible({ timeout: 10000 });
  await expect(dialog.getByText(/30\.000/).first()).toBeVisible();
  await expect(page.getByTestId("factura-total")).toContainText(/70\.000/);
  await expect(page.getByTestId("factura-estado")).toContainText("PENDIENTE");
  await page.screenshot({ path: "e2e/screenshots/41-mov-con-abono.png" });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: /generar factura/i }).click(),
  ]);

  expect(download).not.toBeNull();
  const jpgPath = path.join("e2e", "downloads", `factura-mov-${tag}.jpg`);

  await download?.saveAs(jpgPath);
  const buf = fs.readFileSync(jpgPath);

  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
  await page.setContent(
    `<body style="margin:0;background:#888"><img src="data:image/jpeg;base64,${buf.toString("base64")}" style="width:794px;display:block;margin:0 auto"/></body>`,
  );
  await page.screenshot({
    path: "e2e/screenshots/42-mov-jpg.png",
    fullPage: true,
  });

  await cleanup(request, comp.id, cli.id);
});

test("MOV-3: al pagar todo la factura queda PAGADO en cero", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setup(request, tag);
  const pt = await request.post(`${API}/abonos/pagarTodo/${cli.id}`);

  expect(pt.status()).toBe(200);

  await openFactura(page, nombre);
  await expect(page.getByRole("dialog").getByText(/Abono —/)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByTestId("factura-total")).toContainText(/^\D*0$/);
  await expect(page.getByTestId("factura-estado")).toContainText("PAGADO");
  await page.screenshot({ path: "e2e/screenshots/43-mov-pagado.png" });

  await cleanup(request, comp.id, cli.id);
});

test("MOV-4: al eliminar el abono desaparece y el saldo vuelve", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setup(request, tag);
  const ab = await (
    await request.post(`${API}/abonos`, {
      data: {
        purchase_id: comp.id,
        amount: 30000,
        date: new Date().toISOString(),
      },
    })
  ).json();

  await request.delete(`${API}/abonos/${ab.id}`);

  await openFactura(page, nombre);
  await expect(page.getByRole("dialog").getByText(/Abono —/)).toBeHidden({
    timeout: 10000,
  });
  await expect(page.getByTestId("factura-total")).toContainText(/100\.000/);
  await page.screenshot({ path: "e2e/screenshots/44-mov-abono-eliminado.png" });

  await cleanup(request, comp.id, cli.id);
});
