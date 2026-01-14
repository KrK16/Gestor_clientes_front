import React, { useState, useEffect, MouseEvent } from 'react';
import { DollarSign, Calendar, X, AlertCircle } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { createApiUrl } from "@/config/api";

interface EditarAbonoProps {
  isOpen: boolean;
  onClose: () => void;
  abonoId: number;
  purchaseId: number;
  currentAmount: number;
  currentDate: string;
  onUpdate: () => void;
}

const EditarAbono: React.FC<EditarAbonoProps> = ({
  isOpen,
  onClose,
  abonoId,
  purchaseId,
  currentAmount,
  currentDate,
  onUpdate
}) => {
  const [amount, setAmount] = useState<string>(currentAmount.toString());
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount.toString());
      setFormattedAmount(formatCurrency(currentAmount));
      const formattedDate = formatDateToYYYYMMDD(currentDate);
      setDate(formattedDate);
      setError(null);
    }
  }, [isOpen, currentAmount, currentDate]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value) {
      const numberValue = Number(value);
      setAmount(numberValue.toString());
      setFormattedAmount(formatCurrency(numberValue));
    } else {
      setAmount('0');
      setFormattedAmount('');
    }
    setError(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDateToYYYYMMDD = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const addOneDay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!amount || Number(amount) <= 0) {
      setError("Por favor, ingrese un monto válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl('/abonos', abonoId.toString()), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId: parseInt(purchaseId.toString()),
          amount: Number(amount),
          date: addOneDay(date)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el abono');
      }

      // Actualizar el estado global
      onUpdate();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar el abono');
      console.error('Error al actualizar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="opaque"
      className="w-full max-w-md"
    >
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {(onClose) => (
          <>
            <ModalHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
                  <h2 className="text-xl font-semibold text-gray-800">Editar Abono</h2>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
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
                  <label className="text-sm font-medium text-gray-700">
                    Valor del abono
                  </label>
                  <div className="relative">
                    <DollarSign 
                      size={20} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    />
                    <input
                      type="text"
                      value={formattedAmount}
                      onChange={handleAmountChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-colors"
                      placeholder="Ingrese el valor del abono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha del abono
                  </label>
                  <div className="relative">
                    <Calendar 
                      size={20} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-colors"
                    />
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-gray-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !amount || Number(amount) <= 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
                           flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Abono'
                  )}
                </button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default EditarAbono;