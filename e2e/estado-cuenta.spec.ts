import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function setupMulti(request: any, tag: string) {
  const nombre = `Estado UI ${tag}`;
  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `E${tag}`,
        telefono: "3001112222",
        direccion: "Dir",
        email: `e${tag}@t.com`,
      },
    })
  ).json();
  const mk = async (revista: string, precio: number, vencDias: number) => {
    const r = await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista,
        precio,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + vencDias * 864e5).toISOString(),
      },
    });

    expect(r.status()).toBe(201);

    return r.json();
  };
  const natura = await mk(`Natura EC ${tag}`, 100000, 30);
  const novaventa = await mk(`Novaventa EC ${tag}`, 150000, 30);
  const vitrina = await mk(`Vitrina EC ${tag}`, 80000, 30);
  const camisas = await mk(`Camisas EC ${tag}`, 200000, -10);

  await request.post(`${API}/abonos`, {
    data: {
      purchase_id: novaventa.id,
      amount: 50000,
      date: new Date().toISOString(),
    },
  });

  return {
    cli,
    nombre,
    ids: [natura.id, novaventa.id, vitrina.id, camisas.id],
  };
}

async function cleanup(request: any, ids: number[], cliId: number) {
  for (const id of ids) {
    const abonos = await (
      await request.get(`${API}/abonos/abonocompra/${id}`)
    ).json();

    for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
    await request.delete(`${API}/compras/${id}`);
  }
  await request.delete(`${API}/clientes/${cliId}`);
}

test("EC-1: endpoint agrupa por concepto con subtotales y mora", async ({
  request,
}) => {
  const tag = stamp();
  const { cli, ids } = await setupMulti(request, tag);

  const r = await request.get(`${API}/clientes/${cli.id}/estado-cuenta`);

  expect(r.status()).toBe(200);
  const ec = await r.json();

  expect(ec.grupos.length).toBe(4);
  expect(ec.total).toBe(480000);
  expect(ec.pendientes).toBe(4);
  const byConcepto = Object.fromEntries(
    ec.grupos.map((g: any) => [g.concepto, g.subtotal]),
  );

  expect(byConcepto[`Natura EC ${tag}`]).toBe(100000);
  expect(byConcepto[`Novaventa EC ${tag}`]).toBe(100000);
  expect(byConcepto[`Vitrina EC ${tag}`]).toBe(80000);
  const cam = ec.grupos.find((g: any) => g.concepto === `Camisas EC ${tag}`);

  expect(cam.compras[0].diasMora).toBeGreaterThanOrEqual(9);
  expect(cam.compras[0].vencida).toBe(true);

  const nf = await request.get(`${API}/clientes/999999999/estado-cuenta`);

  expect(nf.status()).toBe(404);

  await cleanup(request, ids, cli.id);
});

test("EC-2: modal muestra grupos, subtotales y descarga JPG", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, nombre, ids } = await setupMulti(request, tag);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Estado de cuenta", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ESTADO DE CUENTA", exact: true }),
  ).toBeVisible({ timeout: 10000 });

  await expect(page.getByTestId("estado-total")).toContainText(/480\.000/);
  await expect(
    page.getByRole("dialog").getByText(`Natura EC ${tag}`),
  ).toBeVisible();
  await expect(page.getByTestId(`subtotal-Natura EC ${tag}`)).toContainText(
    /100\.000/,
  );
  await page.screenshot({ path: "e2e/screenshots/30-estado-cuenta.png" });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: /descargar jpg/i }).click(),
  ]);

  expect(download).not.toBeNull();
  expect(download?.suggestedFilename()).toMatch(/\.jpg$/i);
  const jpgPath = path.join("e2e", "downloads", `estado-${tag}.jpg`);

  await download?.saveAs(jpgPath);
  const buf = fs.readFileSync(jpgPath);

  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
  expect(buf.length).toBeGreaterThan(20000);
  await page.setContent(
    `<body style="margin:0;background:#888"><img src="data:image/jpeg;base64,${buf.toString("base64")}" style="width:794px;display:block;margin:0 auto"/></body>`,
  );
  await page.screenshot({ path: "e2e/screenshots/31-estado-jpg.png" });

  await cleanup(request, ids, cli.id);
});

test("EC-4: en celular el documento mantiene ancho completo y el JPG sale bien", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const tag = stamp();
  const { cli, nombre, ids } = await setupMulti(request, tag);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Estado de cuenta", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ESTADO DE CUENTA", exact: true }),
  ).toBeVisible({ timeout: 10000 });

  const docWidth = await page.evaluate(() => {
    const total = document.querySelector(
      '[data-testid="estado-total"]',
    ) as HTMLElement | null;
    const doc = total?.closest('div[class*="min-w"]') as HTMLElement | null;

    return doc ? doc.getBoundingClientRect().width : 0;
  });

  expect(docWidth).toBeGreaterThanOrEqual(790);
  await page.screenshot({ path: "e2e/screenshots/33-estado-mobile.png" });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }).catch(() => null),
    page.getByRole("button", { name: /descargar jpg/i }).click(),
  ]);

  expect(download).not.toBeNull();
  const jpgPath = path.join("e2e", "downloads", `estado-mobile-${tag}.jpg`);

  await download?.saveAs(jpgPath);
  const buf = fs.readFileSync(jpgPath);

  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
  expect(buf.length).toBeGreaterThan(20000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(
    `<body style="margin:0;background:#888"><img src="data:image/jpeg;base64,${buf.toString("base64")}" style="width:794px;display:block;margin:0 auto"/></body>`,
  );
  await page.screenshot({ path: "e2e/screenshots/34-estado-jpg-mobile.png" });

  await cleanup(request, ids, cli.id);
});

test("EC-3: tras pagar todo el estado queda en cero", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, nombre, ids } = await setupMulti(request, tag);

  const pt = await request.post(`${API}/abonos/pagarTodo/${cli.id}`);

  expect(pt.status()).toBe(200);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: "Estado de cuenta", exact: true })
    .click();
  await expect(page.getByText(/cuenta al día/i)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByTestId("estado-total")).toContainText(/^\D*0$/);
  await page.screenshot({ path: "e2e/screenshots/32-estado-pagado.png" });

  await cleanup(request, ids, cli.id);
});
