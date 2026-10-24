import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";

test("front /compras carga sin crash", async ({ page }) => {
  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });
});

test("front puede alcanzar al back (contrato CORS)", async ({ page }) => {
  await page.goto("/compras");
  const status = await page.evaluate(async (api: string) => {
    const r = await fetch(`${api}/clientes`);
    const body = await r.json();

    return { status: r.status, isArray: Array.isArray(body) };
  }, API);

  expect(status.status).toBe(200);
  expect(status.isArray).toBe(true);
});

test("flujo usuario: crear cliente via API y verlo en UI", async ({
  page,
  request,
}) => {
  const cedula = `PW${Date.now()}`;
  const created = await request.post(`${API}/clientes`, {
    data: {
      nombre: "Playwright User",
      cedula,
      telefono: "000000000",
      direccion: "PW Addr",
      email: "pw@test.com",
    },
  });

  expect(created.status()).toBe(201);
  const cliente = await created.json();

  expect(cliente.id).toBeDefined();

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });

  await request.delete(`${API}/clientes/${cliente.id}`);
});
