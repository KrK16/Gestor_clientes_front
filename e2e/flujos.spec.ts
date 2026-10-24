import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function setupCompra(request: any, tag: string, precio = 80000) {
  const nombre = `Flujo UI ${tag}`;
  const revista = `Revista Flujo ${tag}`;
  const cliRes = await request.post(`${API}/clientes`, {
    data: {
      nombre,
      cedula: `F${tag}`,
      telefono: "3001112222",
      direccion: "Dir",
      email: `f${tag}@t.com`,
    },
  });

  expect(cliRes.status()).toBe(201);
  const cli = await cliRes.json();
  const compRes = await request.post(`${API}/compras`, {
    data: {
      clienteId: cli.id,
      revista,
      precio,
      fechaCompra: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
    },
  });

  expect(compRes.status()).toBe(201);

  return { cli, comp: await compRes.json(), nombre, revista };
}

async function cleanup(request: any, compId: number, cliId: number) {
  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${compId}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${compId}`);
  await request.delete(`${API}/clientes/${cliId}`);
}

test("FLUJO-1: botón Pagar Todo deja deuda en 0", async ({ page, request }) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);

  await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 10000,
      date: new Date().toISOString(),
    },
  });

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  const card = page.locator('div[role="button"]', {
    has: page.getByRole("heading", { name: nombre }),
  });

  await page.screenshot({ path: "e2e/screenshots/09-antes-pagartodo.png" });

  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) =>
          r.url().includes("/abonos/pagarTodo") &&
          r.request().method() === "POST",
        { timeout: 15000 },
      )
      .catch(() => null),
    card.getByRole("button", { name: /pagar todo/i }).click(),
  ]);

  expect(resp?.status()).toBe(200);
  const ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(0);
  expect(ver.status).toBe("pagado");
  await page.screenshot({ path: "e2e/screenshots/10-despues-pagartodo.png" });

  await cleanup(request, comp.id, cli.id);
});

test("FLUJO-2: editar compra desde UI", async ({ page, request }) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);
  const nuevoNombre = `Revista Editada ${tag}`;

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /^editar$/i })
    .first()
    .click();
  await expect(page.getByText("Editar Compra")).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "e2e/screenshots/11-editar-modal.png" });

  await page.locator("#edit-purchase-name").fill(nuevoNombre);
  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().includes("/compras/") && r.request().method() === "PUT",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /guardar cambios/i }).click(),
  ]);

  expect(resp?.status()).toBe(200);
  const ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.name ?? ver.revista).toBe(nuevoNombre);
  await page.screenshot({ path: "e2e/screenshots/12-editada.png" });

  await cleanup(request, comp.id, cli.id);
});

test("FLUJO-3: eliminar compra desde UI", async ({ page, request }) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /^borrar$/i })
    .first()
    .click();
  await expect(page.getByText("Eliminar Compra")).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "e2e/screenshots/13-eliminar-modal.png" });

  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) =>
          r.url().includes("/compras/") && r.request().method() === "DELETE",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /^eliminar$/i }).click(),
  ]);

  expect(resp?.status()).toBe(200);
  const ver = await request.get(`${API}/compras/${comp.id}`);

  expect(ver.status()).toBe(404);
  await page.screenshot({ path: "e2e/screenshots/14-eliminada.png" });

  await request.delete(`${API}/clientes/${cli.id}`);
});

test("FLUJO-5: crear con filtro activo igual muestra la compra nueva", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const otro = await setupCompra(request, `B${tag}`);
  const nombre = `FiltroNuevo ${tag}`;

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(otro.nombre);
  await expect(page.getByText(otro.nombre).first()).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole("button", { name: /nueva compra/i }).click();
  await expect(page.getByText("Agregar Compra")).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: /cliente nuevo/i }).click();
  await page.locator("#customer-name").fill(nombre);
  await page.locator("#customer-phone").fill("3000000000");
  await page.locator("#purchase-name").fill(`Revista Filtro ${tag}`);
  await page.locator("#product-name-0").fill(`Revista Filtro ${tag}`);
  await page.locator("#product-quantity-0").fill("1");
  await page.locator("#product-price-0").fill("10000");
  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) =>
          r.url().includes("/compras/compraNCliente") &&
          r.request().method() === "POST",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /crear compra/i }).click(),
  ]);

  expect(resp?.status()).toBe(201);
  await expect(page.getByText("Agregar Compra")).toBeHidden({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: nombre })).toBeVisible({
    timeout: 10000,
  });

  const list = (await (await request.get(`${API}/clientes`)).json()) as any[];
  const mio = list.find((c) => (c.name ?? c.nombre) === nombre);
  const comps = await (
    await request.get(`${API}/compras/compraU/${mio.id}`)
  ).json();

  for (const co of comps ?? []) {
    await request.delete(`${API}/compras/${co.id}`);
  }
  await request.delete(`${API}/clientes/${mio.id}`);
  await cleanup(request, otro.comp.id, otro.cli.id);
});

test("FLUJO-4: filtros e historial desde UI", async ({ page, request }) => {
  const tagA = stamp();
  const tagB = `B${stamp()}`;
  const setupB = await setupCompra(request, tagB);
  const { cli, comp, nombre, revista } = await setupCompra(request, tagA);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(setupB.nombre).first()).toBeVisible({
    timeout: 10000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(setupB.nombre)).toBeHidden({ timeout: 10000 });
  await page.screenshot({ path: "e2e/screenshots/15-filtro-busqueda.png" });

  await page.locator("#filter-search").fill("ZZZ-sin-coincidencias");
  await expect(page.getByText(nombre)).toBeHidden({ timeout: 10000 });
  await page.screenshot({ path: "e2e/screenshots/16-filtro-vacio.png" });
  await page.locator("#filter-search").fill("");

  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /historial/i })
    .first()
    .click();
  await expect(page.getByText("Historial de Abonos")).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "e2e/screenshots/17-historial.png" });

  expect(revista.length).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await cleanup(request, comp.id, cli.id);
  await cleanup(request, setupB.comp.id, setupB.cli.id);
});
