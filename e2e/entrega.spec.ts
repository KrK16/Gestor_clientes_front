import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

test("ENTREGA-1: crear compra cliente-nuevo desde UI", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const revista = `Revista Entrega ${tag}`;
  const clienteNombre = `Entrega UI ${tag}`;

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.screenshot({ path: "e2e/screenshots/01-home.png" });

  await page.getByRole("button", { name: /nueva/i }).click();
  await expect(page.getByText("Agregar Compra")).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "e2e/screenshots/02-modal-compra.png" });

  await page.getByRole("button", { name: /cliente nuevo/i }).click();
  await page.locator("#customer-name").fill(clienteNombre);
  await page.locator("#customer-phone").fill("3000000000");
  await page.locator("#purchase-name").fill(revista);
  await page.locator("#product-name-0").fill(revista);
  await page.locator("#product-quantity-0").fill("1");
  await page.locator("#product-price-0").fill("50000");
  await page.screenshot({ path: "e2e/screenshots/03-modal-lleno.png" });

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
  await page.screenshot({ path: "e2e/screenshots/04-compra-creada.png" });

  const list = await request.get(`${API}/compras`);

  expect(list.status()).toBe(200);
  const compras = await list.json();
  const creada = compras.find((c: any) => (c.name ?? c.revista) === revista);

  expect(creada).toBeDefined();
  expect(creada.debt).toBe(50000);

  // cleanup
  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${creada.id}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${creada.id}`);
  const clientes = await (await request.get(`${API}/clientes`)).json();
  const cli = (clientes as any[]).find(
    (c) => (c.name ?? c.nombre) === clienteNombre,
  );

  if (cli) await request.delete(`${API}/clientes/${cli.id}`);
});

test("ENTREGA-2: abonar desde UI y pagarTodo deja deuda en 0", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const clienteNombre = `Abono UI ${tag}`;
  const revista = `Revista Abono ${tag}`;

  const cliRes = await request.post(`${API}/clientes`, {
    data: {
      nombre: clienteNombre,
      cedula: `C${tag}`,
      telefono: "3110000000",
      direccion: "Dir",
      email: `a${tag}@t.com`,
    },
  });

  expect(cliRes.status()).toBe(201);
  const cli = await cliRes.json();

  const compRes = await request.post(`${API}/compras`, {
    data: {
      clienteId: cli.id,
      revista,
      precio: 100000,
      fechaCompra: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
    },
  });

  expect(compRes.status()).toBe(201);
  const comp = await compRes.json();

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByText(clienteNombre).first().click();
  await expect(
    page.getByRole("heading", { name: revista }).first(),
  ).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "e2e/screenshots/05-compra-expandida.png" });

  await page
    .getByRole("button", { name: /abonar/i })
    .first()
    .click();
  await expect(page.getByText("Añadir abono")).toBeVisible({ timeout: 10000 });
  await page.locator("#abono-amount").fill("20000");
  await page.screenshot({ path: "e2e/screenshots/06-abono-lleno.png" });

  const [abonoResp] = await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().includes("/abonos") && r.request().method() === "POST",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /agregar abono/i }).click(),
  ]);

  expect(abonoResp?.status()).toBe(200);
  await page.screenshot({ path: "e2e/screenshots/07-abono-creado.png" });

  const pagar = await request.post(`${API}/abonos/pagarTodo/${cli.id}`);

  expect(pagar.status()).toBe(200);
  const ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(0);
  expect(ver.status).toBe("pagado");
  await page.screenshot({ path: "e2e/screenshots/08-pagado.png" });

  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${comp.id}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${comp.id}`);
  await request.delete(`${API}/clientes/${cli.id}`);
});
