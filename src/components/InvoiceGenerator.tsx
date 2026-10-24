import React, { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";

import { createApiUrl } from "@/config/api";
import { downloadJpgFromElement } from "@/utils/exportJpg";

interface Product {
  id: number;
  name: string;
  purchaseId: number;
  quantity: number;
  price: number;
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  price: number;
  customerId: number;
  status: string;
  orderdate: Date;
  payday: Date;
  debt: number;
  createdAt: string;
  name: string;
  products: Product[];
  customer: Customer;
}

interface InvoiceGeneratorProps {
  purchase: Purchase;
}

interface Abono {
  id: number;
  amount: number;
  createdAt: string;
}

interface FacturaRow {
  concepto: string;
  cantidad: string;
  precio: string;
}

const MIN_FILAS = 12;

// Datos de prueba del propietario y cuentas de pago.
// Reemplazar por datos reales cuando se entreguen.
const DATOS_PRUEBA = {
  emisorNombre: "Mi Negocio S.A.S.",
  emisorDireccion: "Calle 123 #45-67, Bogotá",
  emisorCelular: "300 123 4567",
  bcCuenta: "12345678901",
  bcTitular: "Mi Negocio S.A.S.",
  nqCelular: "300 123 4567",
  nqTitular: "Mi Negocio S.A.S.",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const todayISO = () => {
  const h = new Date();

  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ purchase }) => {
  const facturaRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [abonos, setAbonos] = useState<Abono[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    fetch(createApiUrl("/abonos", `abonocompra/${purchase.id}`))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAbonos(Array.isArray(data) ? data : []))
      .catch(() => setAbonos([]));
  }, [isOpen, purchase.id]);

  const totalAbonado = abonos.reduce((s, a) => s + (a.amount || 0), 0);

  const initialRows = (): FacturaRow[] => {
    const base: FacturaRow[] = (purchase.products ?? []).map((p) => ({
      concepto: p.name,
      cantidad: String(p.quantity ?? 1),
      precio: String(p.price ?? 0),
    }));

    while (base.length < MIN_FILAS)
      base.push({ concepto: "", cantidad: "", precio: "" });

    return base;
  };

  const [rows, setRows] = useState<FacturaRow[]>(initialRows);
  const [emisor, setEmisor] = useState({
    nombre: DATOS_PRUEBA.emisorNombre,
    direccion: DATOS_PRUEBA.emisorDireccion,
    celular: DATOS_PRUEBA.emisorCelular,
  });
  const [cliente, setCliente] = useState({
    nombre: purchase.customer.name,
    celular: purchase.customer.phone,
  });
  const [fecha, setFecha] = useState(todayISO());
  const [pagos, setPagos] = useState({
    bcCuenta: DATOS_PRUEBA.bcCuenta,
    bcTitular: DATOS_PRUEBA.bcTitular,
    nqCelular: DATOS_PRUEBA.nqCelular,
    nqTitular: DATOS_PRUEBA.nqTitular,
  });

  const totalProductos = rows.reduce((sum, r) => {
    const c = parseFloat(r.cantidad);
    const p = parseFloat(r.precio);

    return sum + (isNaN(c) || isNaN(p) ? 0 : c * p);
  }, 0);
  const total = totalProductos - totalAbonado;
  const pagado = totalAbonado > 0 && total <= 0;

  const updateRow = (index: number, field: keyof FacturaRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const formatFechaCorta = (iso: string) => {
    const d = new Date(iso);

    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  const handleLimpiar = () => {
    setEmisor({ nombre: "", direccion: "", celular: "" });
    setCliente({ nombre: "", celular: "" });
    setPagos({ bcCuenta: "", bcTitular: "", nqCelular: "", nqTitular: "" });
    setRows(
      Array.from({ length: MIN_FILAS }, () => ({
        concepto: "",
        cantidad: "",
        precio: "",
      })),
    );
  };

  const handleGenerarJPG = async () => {
    if (!facturaRef.current || isSaving) return;
    setIsSaving(true);
    try {
      await downloadJpgFromElement(
        facturaRef.current,
        `Factura_${purchase.name}_${purchase.id}.jpg`,
      );
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    "font-inherit border-0 border-b border-dashed border-gray-300 bg-transparent px-1 py-0.5 w-full min-w-0 rounded-sm focus:outline-none focus:border-blue-500";

  const autoGrowStyle = {
    fieldSizing: "content",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  } as React.CSSProperties;

  const AutoInput = ({
    label,
    value,
    onChange,
    placeholder,
    inputMode,
    className = "",
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputMode?: "tel" | "numeric" | "text";
    className?: string;
  }) => (
    <textarea
      aria-label={label}
      className={`${inputCls} ${className} resize-none overflow-hidden block`}
      inputMode={inputMode}
      placeholder={placeholder}
      rows={1}
      style={autoGrowStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div>
      <button
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2
                  bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors
                  w-full sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <FileText className="shrink-0" size={16} />
        <span className="text-xs sm:text-sm font-medium truncate">
          Descargar Factura
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsOpen(false)}
      >
        <ModalContent className="max-h-[92vh]">
          <ModalHeader className="border-b border-gray-100 flex items-center gap-3">
            <span>Factura N° {purchase.id.toString().padStart(6, "0")}</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${pagado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
              data-testid="factura-estado"
            >
              {pagado ? "PAGADO" : "PENDIENTE"}
            </span>
          </ModalHeader>
          <ModalBody className="p-4 sm:p-6">
            <div
              className="flex gap-2 justify-end flex-wrap mb-4"
              data-html2canvas-ignore="true"
            >
              <Button variant="ghost" onPress={handleLimpiar}>
                Limpiar
              </Button>
              <Button
                color="primary"
                disabled={isSaving}
                onPress={handleGenerarJPG}
              >
                {isSaving ? "Generando..." : "Generar factura (JPG)"}
              </Button>
            </div>

            <div className="overflow-x-auto -mx-1 px-1">
              <div
                ref={facturaRef}
                className="bg-white text-gray-900 p-6 sm:p-9 mx-auto w-full min-w-[794px] max-w-[794px]"
                style={{
                  fontFamily:
                    '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {/* Emisor */}
                <section className="text-sm">
                  <div className="flex gap-2 items-start mb-0.5">
                    <b className="min-w-[78px] flex-none pt-0.5">Nombre:</b>
                    <AutoInput
                      label="Nombre del emisor"
                      placeholder="Tu nombre o empresa"
                      value={emisor.nombre}
                      onChange={(v) => setEmisor({ ...emisor, nombre: v })}
                    />
                  </div>
                  <div className="flex gap-2 items-start mb-0.5">
                    <b className="min-w-[78px] flex-none pt-0.5">Dirección:</b>
                    <AutoInput
                      label="Dirección del emisor"
                      placeholder="Tu dirección"
                      value={emisor.direccion}
                      onChange={(v) => setEmisor({ ...emisor, direccion: v })}
                    />
                  </div>
                  <div className="flex gap-2 items-start">
                    <b className="min-w-[78px] flex-none pt-0.5">Celular:</b>
                    <AutoInput
                      inputMode="tel"
                      label="Celular del emisor"
                      placeholder="300 000 0000"
                      value={emisor.celular}
                      onChange={(v) => setEmisor({ ...emisor, celular: v })}
                    />
                  </div>
                </section>

                {/* Título */}
                <section className="flex justify-between items-end my-4">
                  <h1
                    className="m-0 font-extrabold"
                    style={{ fontSize: 44, color: "#10243e" }}
                  >
                    FACTURA
                  </h1>
                  <div className="flex gap-2 items-baseline font-bold text-sm">
                    <span>Fecha:</span>
                    <input
                      aria-label="Fecha de la factura"
                      className={inputCls}
                      style={{ width: 150 }}
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                </section>

                {/* Cliente */}
                <section className="border-[1.5px] border-gray-800 p-3.5 mb-5 text-sm">
                  <div className="flex gap-2 items-start my-0.5">
                    <b className="min-w-[78px] flex-none pt-0.5">Cliente:</b>
                    <AutoInput
                      label="Nombre del cliente"
                      placeholder="Nombre del cliente"
                      value={cliente.nombre}
                      onChange={(v) => setCliente({ ...cliente, nombre: v })}
                    />
                  </div>
                  <div className="flex gap-2 items-start my-0.5">
                    <b className="min-w-[78px] flex-none pt-0.5">Celular:</b>
                    <AutoInput
                      inputMode="tel"
                      label="Celular del cliente"
                      placeholder="Celular del cliente"
                      value={cliente.celular}
                      onChange={(v) => setCliente({ ...cliente, celular: v })}
                    />
                  </div>
                </section>

                {/* Tabla */}
                <table className="w-full border-collapse table-fixed text-sm">
                  <thead>
                    <tr style={{ background: "#f3f5f7" }}>
                      <th
                        className="p-1.5 border border-gray-800"
                        style={{ color: "#10243e", width: "46%" }}
                      >
                        CONCEPTO
                      </th>
                      <th
                        className="p-1.5 border border-gray-800"
                        style={{ color: "#10243e", width: "14%" }}
                      >
                        CANTIDAD
                      </th>
                      <th
                        className="p-1.5 border border-gray-800"
                        style={{ color: "#10243e", width: "20%" }}
                      >
                        PRECIO
                      </th>
                      <th
                        className="p-1.5 border border-gray-800"
                        style={{ color: "#10243e", width: "20%" }}
                      >
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const c = parseFloat(r.cantidad);
                      const p = parseFloat(r.precio);
                      const t = isNaN(c) || isNaN(p) ? 0 : c * p;
                      const hay =
                        r.concepto.trim() !== "" || !isNaN(c) || !isNaN(p);

                      return (
                        <tr key={i}>
                          <td className="border border-gray-300 p-0 align-top">
                            <AutoInput
                              className="px-2 py-1 text-sm"
                              label={`Concepto fila ${i + 1}`}
                              value={r.concepto}
                              onChange={(v) => updateRow(i, "concepto", v)}
                            />
                          </td>
                          <td className="border border-gray-300 p-0 h-[30px]">
                            <input
                              aria-label={`Cantidad fila ${i + 1}`}
                              className={`${inputCls} h-[30px] px-2 text-right`}
                              min="0"
                              type="number"
                              value={r.cantidad}
                              onChange={(e) =>
                                updateRow(i, "cantidad", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-gray-300 p-0 h-[30px]">
                            <input
                              aria-label={`Precio fila ${i + 1}`}
                              className={`${inputCls} h-[30px] px-2 text-right`}
                              min="0"
                              type="number"
                              value={r.precio}
                              onChange={(e) =>
                                updateRow(i, "precio", e.target.value)
                              }
                            />
                          </td>
                          <td className="border border-gray-300 px-2 text-right tabular-nums text-sm">
                            {hay ? formatCurrency(t) : " "}
                          </td>
                        </tr>
                      );
                    })}
                    {abonos.map((a) => (
                      <tr key={`abono-${a.id}`}>
                        <td className="border border-gray-300 px-2 py-1 text-sm">
                          Abono — {formatFechaCorta(a.createdAt)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm text-gray-400">
                          —
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right tabular-nums text-sm text-green-700">
                          -{formatCurrency(a.amount)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right tabular-nums text-sm text-green-700">
                          -{formatCurrency(a.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <section className="flex justify-end mt-3.5">
                  <div
                    className="flex gap-7 items-center text-white px-5 py-3 rounded-md text-base"
                    style={{ background: "#10243e" }}
                  >
                    <span>TOTAL A PAGAR</span>
                    <strong
                      className="text-xl tabular-nums"
                      data-testid="factura-total"
                    >
                      {formatCurrency(total)}
                    </strong>
                  </div>
                </section>

                {/* Métodos de pago */}
                <section className="mt-6 border-[1.5px] border-gray-800">
                  <h2
                    className="m-0 text-center text-sm p-2 border-b-[1.5px] border-gray-800"
                    style={{ background: "#f3f5f7", color: "#10243e" }}
                  >
                    MÉTODOS DE PAGO
                  </h2>
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className="flex-none w-14 h-14 rounded-[10px] flex items-center justify-center text-white font-extrabold text-xl"
                      style={{ background: "#00448d" }}
                    >
                      B
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex gap-2 items-start flex-wrap">
                        <b className="whitespace-nowrap flex-none pt-0.5">
                          1. Ahorros Bancolombia:
                        </b>
                        <AutoInput
                          className="font-bold"
                          inputMode="numeric"
                          label="Cuenta Bancolombia"
                          placeholder="Número de cuenta"
                          value={pagos.bcCuenta}
                          onChange={(v) => setPagos({ ...pagos, bcCuenta: v })}
                        />
                      </div>
                      <div className="flex gap-2 items-start flex-wrap mt-0.5">
                        <b className="whitespace-nowrap flex-none pt-0.5">
                          A nombre de:
                        </b>
                        <AutoInput
                          label="Titular Bancolombia"
                          placeholder="Nombre del titular"
                          value={pagos.bcTitular}
                          onChange={(v) => setPagos({ ...pagos, bcTitular: v })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border-t border-gray-300">
                    <div
                      className="flex-none w-14 h-14 rounded-[10px] flex items-center justify-center text-white font-extrabold text-xl"
                      style={{ background: "#5b2d82" }}
                    >
                      N
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex gap-2 items-start flex-wrap">
                        <b className="whitespace-nowrap flex-none pt-0.5">
                          2. Nequi:
                        </b>
                        <AutoInput
                          className="font-bold"
                          inputMode="tel"
                          label="Celular Nequi"
                          placeholder="Número de celular"
                          value={pagos.nqCelular}
                          onChange={(v) => setPagos({ ...pagos, nqCelular: v })}
                        />
                      </div>
                      <div className="flex gap-2 items-start flex-wrap mt-0.5">
                        <b className="whitespace-nowrap flex-none pt-0.5">
                          A nombre de:
                        </b>
                        <AutoInput
                          label="Titular Nequi"
                          placeholder="Nombre del titular"
                          value={pagos.nqTitular}
                          onChange={(v) => setPagos({ ...pagos, nqTitular: v })}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default InvoiceGenerator;
