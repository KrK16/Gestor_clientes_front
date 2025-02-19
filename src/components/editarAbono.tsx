import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, X, AlertCircle } from 'lucide-react';

interface EditarAbonoProps {
  isOpen: boolean;
  onClose: () => void;
  abonoId: number;
  purchaseId: number;
  currentAmount: number;
  onUpdate: () => void;
}

const EditarAbono: React.FC<EditarAbonoProps> = ({
  isOpen,
  onClose,
  abonoId,
  purchaseId,
  currentAmount,
  onUpdate
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount.toString());
      setError(null);
    }
  }, [isOpen, currentAmount]);

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Number(number));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://26.241.225.40:3000/abonos/${abonoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId: parseInt(purchaseId.toString()),
          amount: Number(amount.replace(/\D/g, '')),
        }),
      });
  
      if (response.status === 200) {
        // Call onUpdate to trigger parent component refresh
        onUpdate();
        // Close the modal
        onClose();
      } else {
        throw new Error('Error al actualizar el abono');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error al actualizar:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl animate-in fade-in">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
                <h2 className="text-xl font-semibold text-gray-800">
                  Editar Abono
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

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
                  value={formatCurrency(amount)}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           transition-colors"
                  placeholder="Ingrese el valor del abono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg
                       transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg
                       hover:bg-blue-600 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
      </div>
    </>
  );
};

export default EditarAbono;