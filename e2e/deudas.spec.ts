import { test, expect } from "@playwright/test";

const API = "http://localhost:3000";
const stamp = () => Date.now().toString().slice(-6);

async function setupCompra(request: any, tag: string, precio = 300000) {
  const nombre = `Deuda UI ${tag}`;
  const cli = await (
    await request.post(`${API}/clientes`, {
      data: {
        nombre,
        cedula: `D${tag}`,
        telefono: "3001112222",
        direccion: "Dir",
        email: `d${tag}@t.com`,
      },
    })
  ).json();
  const comp = await (
    await request.post(`${API}/compras`, {
      data: {
        clienteId: cli.id,
        revista: `Revista Deuda ${tag}`,
        precio,
        fechaCompra: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    })
  ).json();

  return { cli, comp, nombre };
}

async function cleanup(request: any, compId: number, cliId: number) {
  const abonos = await (
    await request.get(`${API}/abonos/abonocompra/${compId}`)
  ).json();

  for (const a of abonos ?? []) await request.delete(`${API}/abonos/${a.id}`);
  await request.delete(`${API}/compras/${compId}`);
  await request.delete(`${API}/clientes/${cliId}`);
}

test("D1: abono parcial y exacto; excedido se rechaza contra la deuda vigente", async ({
  request,
}) => {
  const tag = stamp();
  const { cli, comp } = await setupCompra(request, tag);

  const a1 = await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 100000,
      date: new Date().toISOString(),
    },
  });

  expect(a1.status()).toBe(200);
  let ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(200000);

  const exceso = await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 250000,
      date: new Date().toISOString(),
    },
  });

  expect(exceso.status()).toBe(400);
  ver = await (await request.get(`${API}/compras/${comp.id}`)).json();
  expect(ver.debt).toBe(200000);

  const exacto = await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 200000,
      date: new Date().toISOString(),
    },
  });

  expect(exacto.status()).toBe(200);
  ver = await (await request.get(`${API}/compras/${comp.id}`)).json();
  expect(ver.debt).toBe(0);
  expect(ver.status).toBe("pagado");

  await cleanup(request, comp.id, cli.id);
});

test("D2: pagarTodo y luego subir el precio reabre la deuda", async ({
  request,
}) => {
  const tag = stamp();
  const { cli, comp } = await setupCompra(request, tag, 300000);

  const pt = await request.post(`${API}/abonos/pagarTodo/${cli.id}`);

  expect(pt.status()).toBe(200);
  let ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(0);
  expect(ver.status).toBe("pagado");

  const edit = await request.put(`${API}/compras/${comp.id}`, {
    data: { precio: 400000 },
  });

  expect(edit.status()).toBe(200);
  ver = await (await request.get(`${API}/compras/${comp.id}`)).json();
  expect(ver.debt).toBe(100000);
  expect(ver.status).toBe("pendiente");

  await cleanup(request, comp.id, cli.id);
});

test("D3: bajar el precio recalcula; nunca queda deuda negativa", async ({
  request,
}) => {
  const tag = stamp();
  const { cli, comp } = await setupCompra(request, tag, 300000);

  await request.post(`${API}/abonos`, {
    data: {
      purchase_id: comp.id,
      amount: 100000,
      date: new Date().toISOString(),
    },
  });

  let edit = await request.put(`${API}/compras/${comp.id}`, {
    data: { precio: 250000 },
  });

  expect(edit.status()).toBe(200);
  let ver = await (await request.get(`${API}/compras/${comp.id}`)).json();

  expect(ver.debt).toBe(150000);
  expect(ver.status).toBe("pendiente");

  edit = await request.put(`${API}/compras/${comp.id}`, {
    data: { precio: 50000 },
  });
  expect(edit.status()).toBe(200);
  ver = await (await request.get(`${API}/compras/${comp.id}`)).json();
  expect(ver.debt).toBe(0);
  expect(ver.status).toBe("pagado");

  await cleanup(request, comp.id, cli.id);
});

test("D4: doble-click en Guardar crea un solo cliente", async ({
  page,
  request,
}) => {
  const tag = stamp();

  await page.goto("/compras");
  await expect(page.getByText("Gestión de Clientes")).toBeVisible({
    timeout: 15000,
  });

  await page.route("**/clientes", async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  await page.getByRole("button", { name: /nueva compra/i }).click();
  await expect(page.getByText("Agregar Compra")).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: /cliente nuevo/i }).click();
  await page.locator("#customer-name").fill(`Doble ${tag}`);
  await page.locator("#customer-phone").fill("3000000000");
  await page.locator("#purchase-name").fill(`Revista Doble ${tag}`);
  await page.locator("#product-name-0").fill(`Revista Doble ${tag}`);
  await page.locator("#product-quantity-0").fill("1");
  await page.locator("#product-price-0").fill("10000");

  const btn = page.getByRole("button", { name: /crear compra/i });

  await btn.dblclick();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "e2e/screenshots/23-doble-click.png" });

  const list = await (await request.get(`${API}/clientes`)).json();
  const mios = (list as any[]).filter((c) =>
    ((c.name ?? c.nombre ?? "") as string).startsWith(`Doble ${tag}`),
  );

  expect(mios.length).toBe(1);

  for (const c of list as any[]) {
    if (((c.name ?? c.nombre ?? "") as string).startsWith(`Doble ${tag}`)) {
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
  await page.unroute("**/clientes");
});
