import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function cleanup(request: any, nombre: string) {
  const list = (await (await request.get(`${API}/clientes`)).json()) as any[];

  for (const c of list) {
    if ((c.name ?? c.nombre ?? "").startsWith(nombre)) {
      const comps = await (
        await request.get(`${API}/compras/compraU/${c.id}`)
      ).json();

      for (const co of comps ?? []) {
        const abs = await (
          await request.get(`${API}/abonos/abonocompra/${co.id}`)
        ).json();

        for (const a of abs ?? [])
          await request.delete(`${API}/abonos/${a.id}`);
        await request.delete(`${API}/compras/${co.id}`);
      }
      await request.delete(`${API}/clientes/${c.id}`);
    }
  }
}

test("DET-1: compra con 2 productos muestra el detalle real y fecha de pago en Ver", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const nombre = `Detalle ${tag}`;

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: /nueva compra/i }).click();
  await expect(page.getByText("Agregar Compra")).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: /cliente nuevo/i }).click();
  await page.locator("#customer-name").fill(nombre);
  await page.locator("#customer-phone").fill("3000000000");
  await page.locator("#purchase-name").fill(`Compra Det ${tag}`);
  await page.locator("#product-name-0").fill(`Camisa Roja ${tag}`);
  await page.locator("#product-quantity-0").fill("2");
  await page.locator("#product-price-0").fill("50000");
  await page.getByRole("button", { name: /agregar producto/i }).click();
  await page.locator("#product-name-1").fill(`Pantalon Azul ${tag}`);
  await page.locator("#product-quantity-1").fill("1");
  await page.locator("#product-price-1").fill("80000");

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
  const creada = await resp?.json();

  expect(creada.products.length).toBe(2);

  await expect(page.getByText("Agregar Compra")).toBeHidden({ timeout: 10000 });
  await page.getByText(nombre).first().click();
  await page.getByRole("button", { name: /^ver$/i }).first().click();
  await expect(page.getByText("Detalles de la Compra")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(`Camisa Roja ${tag}`)).toBeVisible();
  await expect(page.getByText(`Pantalon Azul ${tag}`)).toBeVisible();
  await expect(page.getByText("Fecha de Pago:")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/50-detalle-ver.png" });

  // La API también devuelve el detalle real
  const ver = await (await request.get(`${API}/compras/${creada.id}`)).json();

  expect(ver.products.length).toBe(2);
  expect(ver.price).toBe(180000);

  await cleanup(request, nombre);
});

test("DET-2: editar mantiene el detalle y recalcula el total", async ({
  page,
  request,
}) => {
  const tag = stamp();
  const nombre = `DetalleEd ${tag}`;

  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `D${tag}`,
        telefono: "1",
        direccion: "D",
        email: `d${tag}@t.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista: `Rev ${tag}`,
        precio: 100000,
        productos: [
          { nombre: `Item A ${tag}`, cantidad: 1, precio: 60000 },
          { nombre: `Item B ${tag}`, cantidad: 2, precio: 20000 },
        ],
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  expect(comp.products.length).toBe(2);

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
  await page.locator("#filter-search").fill(nombre);
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 10000 });
  await page.getByText(nombre).first().click();
  await page
    .getByRole("button", { name: /^editar$/i })
    .first()
    .click();
  await expect(page.getByText("Editar Compra")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#edit-product-name-0")).toHaveValue(
    `Item A ${tag}`,
  );

  // Quito el segundo producto con su papelera y guardo: total debe ser 60000
  await page.getByRole("dialog").locator("button.text-red-500").nth(1).click();
  const [resp] = await Promise.all([
    page
      .waitForResponse(
        (r) =>
          r.url().match(/\/compras\/\d+$/) && r.request().method() === "PUT",
        { timeout: 15000 },
      )
      .catch(() => null),
    page.getByRole("button", { name: /guardar cambios/i }).click(),
  ]);

  expect(resp?.status()).toBe(200);
  const ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.price).toBe(60000);
  expect(ver.products.length).toBe(1);
  await page.screenshot({ path: "e2e/screenshots/51-detalle-editado.png" });

  await cleanup(request, nombre);
});
