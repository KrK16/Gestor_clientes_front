import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { AlertCircle, DollarSign, Calendar } from "lucide-react";

import { createApiUrl } from "@/config/api";

interface AgregarAbonoProps {
  purchaseId: number;
  onAdd: (abono: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AgregarAbono: React.FC<AgregarAbonoProps> = ({
  purchaseId,
  onAdd,
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState<number | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(null);
      setFormattedAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setError(null);
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");

    setError(null);

    if (value) {
      const numberValue = Number(value);

      setAmount(numberValue);
      setFormattedAmount(formatCurrency(numberValue));
    } else {
      setAmount(null);
      setFormattedAmount("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!amount) {
      setError("Por favor, ingrese el monto del abono");

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl("/abonos"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchase_id: purchaseId,
          amount,
          date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const raw =
          typeof data === "string" ? data : (data?.message ?? data?.error);

        setError(raw || "Ocurrió un problema al procesar el abono");

        return;
      }

      onAdd(data);
      onClose();
    } catch {
      setError(
        "Error de conexión al agregar el abono. Por favor, inténtelo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Modal
      backdrop="blur"
      className="w-full max-w-md mx-auto"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
            <h2 className="text-xl font-medium text-gray-800">Añadir abono</h2>
          </div>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg animate-shake">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="abono-amount"
              >
                Monto del Abono
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           transition-colors"
                  id="abono-amount"
                  placeholder="$0"
                  type="text"
                  value={formattedAmount}
                  onChange={handleAmountChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="abono-date"
              >
                Fecha del Abono
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           transition-colors"
                  id="abono-date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-gray-100 p-6">
          <div className="flex justify-end gap-3">
            <Button
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              color="danger"
              variant="light"
              onPress={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center gap-2"
              color="primary"
              disabled={isLoading || !amount}
              onPress={handleSubmit}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Procesando...
                </>
              ) : (
                "Agregar Abono"
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AgregarAbono;
