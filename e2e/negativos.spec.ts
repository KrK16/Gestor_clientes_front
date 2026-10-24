import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function setupCompra(request: any, tag: string, precio = 60000) {
  const nombre = `Neg UI ${tag}`;
  const revista = `Revista Neg ${tag}`;
  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `N${tag}`,
        telefono: "3009998888",
        direccion: "Dir",
        email: `n${tag}@t.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista,
        precio,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  return { cli, comp, nombre, revista };
}

async function cleanup(request: any, compId: number, cliId: number) {
  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${compId}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${compId}`);
  await request.delete(`${API}/clientes/${cliId}`);
}

test("NEG-1: abono mayor que la deuda muestra error y no descuenta", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag, 50000);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /abonar/i })
    .first()
    .click();
  await expect(page.getByText("Añadir abono")).toBeVisible({ timeout: 10000 });
  await page.locator("#abono-amount").fill("999999");
  await page.screenshot({ path: "e2e/screenshots/18-abono-excesivo.png" });

  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().endsWith("/abonos") && r.request().method() === "POST",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /agregar abono/i }).click(),
  ]);

  expect(resp?.status()).toBe(400);
  await expect(page.getByText(/no puede ser mayor/i)).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "e2e/screenshots/19-error-deuda.png" });

  const ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(50000);
  await page.keyboard.press("Escape");
  await cleanup(request, comp.id, cli.id);
});

test("NEG-2: sin monto el botón Agregar Abono queda deshabilitado", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /abonar/i })
    .first()
    .click();
  await expect(page.getByText("Añadir abono")).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("button", { name: /agregar abono/i }),
  ).toBeDisabled();
  await page.screenshot({ path: "e2e/screenshots/20-abono-deshabilitado.png" });

  await page.keyboard.press("Escape");
  await cleanup(request, comp.id, cli.id);
});

test("NEG-3: crear cliente incompleto vía API da 400", async ({
  page,
  request,
}) => {
  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  const r = await request.post(`${API}/clientes`, {
    data: { nombre: "Solo Nombre" },
  });

  expect(r.status()).toBe(400);
  await page.screenshot({ path: "e2e/screenshots/21-home-tras-neg3.png" });
});

test("NEG-4: editar abono con monto mayor que la deuda da 400", async ({
  request,
}) => {
  const tag = stamp();
  const { cli, comp } = await setupCompra(request, tag, 40000);
  const abono = await (
    await request.post(`${API}/abonos`, {
      data: {
        purchase_id: comp.id,
        amount: 5000,
        date: new Date().toISOString(),
      },
    })
  ).json();
  const r = await request.put(`${API}/abonos/${abono.id}`, {
    data: {
      purchaseId: comp.id,
      amount: 999999,
      date: new Date().toISOString(),
    },
  });

  expect(r.status()).toBe(400);
  await cleanup(request, comp.id, cli.id);
});

test("NEG-5: borrar compra con abonos documenta el comportamiento", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);

  await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 5000,
      date: new Date().toISOString(),
    },
  });

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

  await page.screenshot({ path: "e2e/screenshots/22-borrar-con-abonos.png" });

  // La compra con abonos NO se puede borrar (FK): el back da 400 y el modal
  // debe seguir abierto mostrando el error en vez de fallar en silencio.
  expect(resp?.status()).toBe(400);
  await expect(page.getByText("Eliminar Compra")).toBeVisible();
  await expect(page.getByText(/no se puede eliminar/i)).toBeVisible({
    timeout: 10000,
  });
  const ver = await request.get(`${API}/compras/${comp.id}`);

  expect(ver.status()).toBe(200);
  await page.keyboard.press("Escape");
  await cleanup(request, comp.id, cli.id);
});

test("NEG-6: compra pagada con abonos sí se puede eliminar", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const { cli, comp, nombre } = await setupCompra(request, tag);
  const pt = await request.post(`${API}/abonos/pagarTodo/${cli.id}`);

  expect(pt.status()).toBe(200);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /^borrar$/i })
    .first()
    .click();
  await expect(page.getByText("Eliminar Compra")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/abono\(s\) registrado/i)).toBeVisible({
    timeout: 10000,
  });

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
  const gone = await request.get(`${API}/compras/${comp.id}`);

  expect(gone.status()).toBe(404);
  await page.screenshot({ path: "e2e/screenshots/45-borrada-pagada.png" });

  await request.delete(`${API}/clientes/${cli.id}`);
});
