import React, { useRef, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";

import { createApiUrl } from "@/config/api";
import { downloadJpgFromElement } from "@/utils/exportJpg";

interface EstadoCompra {
  id: number;
  concepto: string;
  precio: number;
  abonado: number;
  debt: number;
  status: string;
  fechaCompra: string;
  fechaVencimiento: string;
  diasMora: number;
  vencida: boolean;
}

interface EstadoGrupo {
  concepto: string;
  compras: EstadoCompra[];
  subtotal: number;
}

interface EstadoCuentaData {
  cliente: { id: number; name: string; phone: string };
  corte: string;
  grupos: EstadoGrupo[];
  total: number;
  pendientes: number;
}

interface EstadoCuentaProps {
  customerId: number;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatFecha = (iso: string) => {
  const d = new Date(iso);

  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const EstadoCuenta: React.FC<EstadoCuentaProps> = ({
  customerId,
  customerName,
  isOpen,
  onClose,
}) => {
  const docRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<EstadoCuentaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setData(null);
    fetch(createApiUrl("/clientes", `${customerId}/estado-cuenta`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Error"))))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, customerId]);

  const handleDescargarJPG = async () => {
    if (!docRef.current || isSaving) return;
    setIsSaving(true);
    try {
      await downloadJpgFromElement(
        docRef.current,
        `EstadoCuenta_${customerName}_${customerId}.jpg`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent className="max-h-[92vh]">
        <ModalHeader className="border-b border-gray-100">
          Estado de cuenta — {customerName}
        </ModalHeader>
        <ModalBody className="p-4 sm:p-6">
          <div
            className="flex gap-2 justify-end flex-wrap mb-4"
            data-html2canvas-ignore="true"
          >
            <Button
              color="primary"
              disabled={isSaving || !data}
              onPress={handleDescargarJPG}
            >
              {isSaving ? "Generando..." : "Descargar JPG"}
            </Button>
          </div>

          {loading && (
            <p className="text-center text-gray-500 py-8">
              Cargando estado de cuenta...
            </p>
          )}
          {!loading && !data && (
            <p className="text-center text-red-600 py-8">
              No se pudo cargar el estado de cuenta.
            </p>
          )}
          {data && (
            <div className="overflow-x-auto -mx-1 px-1">
              <div
                ref={docRef}
                className="bg-white text-gray-900 p-6 sm:p-9 mx-auto w-full min-w-[794px] max-w-[794px]"
                style={{
                  fontFamily:
                    '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                <section className="text-sm">
                  <div>
                    <b>Cliente:</b> {data.cliente.name}
                  </div>
                  <div>
                    <b>Teléfono:</b> {data.cliente.phone}
                  </div>
                  <div>
                    <b>Corte:</b> {formatFecha(data.corte)}
                  </div>
                </section>

                <section className="flex justify-between items-end my-4">
                  <h1
                    className="m-0 font-extrabold"
                    style={{ fontSize: 36, color: "#10243e" }}
                  >
                    ESTADO DE CUENTA
                  </h1>
                  <span className="text-sm text-gray-600">
                    {data.pendientes} compra(s) pendiente(s)
                  </span>
                </section>

                {data.grupos.length === 0 && (
                  <p className="text-center text-green-700 font-semibold py-6">
                    Sin deudas pendientes. ¡Cuenta al día!
                  </p>
                )}

                {data.grupos.map((g) => (
                  <section key={g.concepto} className="mb-5">
                    <div
                      className="flex justify-between items-center px-3 py-2 rounded-t-md text-white text-sm font-bold"
                      style={{ background: "#10243e" }}
                    >
                      <span>{g.concepto}</span>
                      <span data-testid={`subtotal-${g.concepto}`}>
                        Subtotal: {formatCurrency(g.subtotal)}
                      </span>
                    </div>
                    <table className="w-full border-collapse table-fixed text-sm">
                      <thead>
                        <tr style={{ background: "#f3f5f7" }}>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "12%" }}
                          >
                            COMPRA
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "16%" }}
                          >
                            FECHA
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "16%" }}
                          >
                            VENCE
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "14%" }}
                          >
                            MORA
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "14%" }}
                          >
                            PRECIO
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "14%" }}
                          >
                            ABONADO
                          </th>
                          <th
                            className="p-1.5 border border-gray-800"
                            style={{ color: "#10243e", width: "14%" }}
                          >
                            SALDO
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.compras.map((c) => (
                          <tr key={c.id}>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              #{c.id}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {formatFecha(c.fechaCompra)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {formatFecha(c.fechaVencimiento)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {c.vencida ? (
                                <span className="text-red-600 font-bold">
                                  {c.diasMora}d
                                </span>
                              ) : (
                                <span className="text-green-600">al día</span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">
                              {formatCurrency(c.precio)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-right tabular-nums text-green-700">
                              {formatCurrency(c.abonado)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-right tabular-nums font-bold">
                              {formatCurrency(c.debt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ))}

                <section className="flex justify-end mt-3.5">
                  <div
                    className="flex gap-7 items-center text-white px-5 py-3 rounded-md text-base"
                    style={{ background: "#10243e" }}
                  >
                    <span>TOTAL A PAGAR</span>
                    <strong
                      className="text-xl tabular-nums"
                      data-testid="estado-total"
                    >
                      {formatCurrency(data.total)}
                    </strong>
                  </div>
                </section>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EstadoCuenta;
