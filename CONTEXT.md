# Gestor_clientes_front — Frontend (CONTEXT.md)

> Documento de contexto del proyecto. Léelo antes de tocar código.
> Repo back hermano: `Gestor_clientes` (ver su CONTEXT.md). API en `http://localhost:3000`.

## Qué es
SPA React (Vite + TypeScript + HeroUI + Tailwind) del gestor de clientes.
Una sola ruta real: **`/compras`** (ver `src/App.tsx`; `/` queda vacío a propósito).

## Stack
- React 18 + Vite 5 + TypeScript + HeroUI + Tailwind + React Router + Recharts + html2canvas + jsPDF (instalado pero ya no se usa)
- Sin librería de tests unitarios. E2E: **Playwright** (`npx playwright test`, 1 worker — ver trampas).

## Cómo levantar
```bash
npm install
npm run dev        # puerto 3001 (strictPort). NUNCA `npm run build` sin pedirlo
```
Base URL del back: `src/config/api.ts` (`API_CONFIG.BASE_URL`).

## Mapa (src/)
- `pages/compras.tsx` — pantalla principal (filtros, cards de cliente, modales).
- `hooks/usePurchases.ts` — estado + `handleAdd/Update/Delete/PayAll/refreshPurchases/applyExternalFilter`.
- `hooks/useFilters.ts` — filtros por búsqueda/nombre/estado (¡cableado vía `applyExternalFilter`, ver trampas!).
- `components/` — `agregar|editar|eliminar + Compra|Cliente|Abono`, `VerAbonos`, `InvoiceGenerator`, `EstadoCuenta`, `seleccionarCliente`, `purchases/*`.
- `services/purchasesAPI.ts` — llamadas + normalización defensiva.
- `utils/exportJpg.ts` — clon estático (textarea/input→div) + descarga JPG vía html2canvas.
- Tipos ES (front) ≠ API (back ES): el back mapea (`controllers/comprasController.js`).

## Flujos que SÍ funcionan así (no "mejorar" sin hablarlo)
- **Crear compra** limpia los filtros para que la tarjeta nueva siempre sea visible (`handleAddAndReveal`).
- **Guardado con doble-click**: guards `savingRef` + botón disabled ("Guardando...") en modales.
- **Eliminar compra**: si `debt > 0` con abonos → error visible con el mensaje del back; si está pagada → se borra con sus abonos (el modal avisa cuántos).
- **Editar compra**: recalcula total sumando productos; quitar filas es solo local hasta Guardar (PUT reemplaza el detalle).
- **Factura (JPG)**: modal con diseño propio, emisor/pagos precargados (datos de prueba `Mi Negocio S.A.S.` — reemplazar al entregar), tabla con filas de abono en verde (`Abono — fecha`, negativos), TOTAL = productos − abonos, badge PAGADO/PENDIENTE. Logo real: poner PNGs en `public/` y usar `<img>`.
- **Estado de cuenta**: botón por cliente → modal agrupado por concepto con mora + JPG.
- **Documentos (factura/estado)**: ancho fijo 794px con scroll lateral (como Google Docs en móvil); el JPG siempre sale completo.

## ⚠️ TRAMPAS CONOCIDAS (leer 2 veces)
1. **E2E comparte `dev.db`**: Playwright pega contra el back real. Los specs crean datos con tag único y los borran al final. Si un test falla a mitad, deja basura visible: limpiarla a mano.
2. **`workers: 1` obligatorio** en `playwright.config.ts` (misma DB = cross-talk entre tests paralelos).
3. **`getByText` hace substring**: scopear a `getByRole('dialog')` o `exact: true`; los headings de cards son únicos, el texto suelto no. Los `aria-label` tipo “Concepto fila 1” colisionan con 10/11/12 → `exact: true`.
4. **El card padre hereda el nombre accesible del botón hijo** (`role=button` anidado): para clickear "Estado de cuenta" usar `{ name: "Estado de cuenta", exact: true }`.
5. **API devuelve campos mapeados** (`name`, no `nombre`): los asserts/cleanups de tests deben usar `c.name ?? c.nombre`.
6. **html2canvas NO renderiza `<textarea>`**: por eso los documentos se capturan vía clon a divs (`utils/exportJpg.ts`). No volver a capturar textareas directo.
7. **`field-sizing: content`** solo funciona en Chromium (las textareas auto-expansibles dependen de eso).
8. **Filtros**: `useFilters` calcula pero quien manda es `usePurchases.filteredPurchases`; el puente es `applyExternalFilter` + `useEffect` en `compras.tsx`. Si agregás una fuente de datos nueva, cableala igual.

## Tests (32 E2E, `e2e/`)
`compras` (carga/CORS) · `flujos` (Pagar Todo, editar, borrar, filtros, crear-con-filtro) · `deudas` (abono parcial/exacto/excedido, editar-precio, doble-click) · `entrega` (cliente nuevo, abonar) · `negativos` (errores 400, borrar con/sin deuda) · `factura*` (JPG, valores largos, abonos como filas) · `estado-cuenta` (grupos, mora, mobile 390px, JPG) · capturas en `e2e/screenshots/`, descargas en `e2e/downloads/` (ignorado en git).

## Puertas de calidad
```bash
npx tsc --noEmit
npx eslint -c .eslintrc.json "src/**/*.{ts,tsx}" "e2e/*.ts"   # debe dar 0 warnings
npx playwright test                                            # 1 worker, con back+front levantados
```

## Pendiente (negocio)
- Reemplazar datos de prueba del emisor/pagos por los reales.
- Logos reales de Bancolombia/Nequi en `public/`.
- Recibo de pago post-Pagar Todo (propuesto, no implementado).
- CORS + URL de producción al desplegar (ver back).
