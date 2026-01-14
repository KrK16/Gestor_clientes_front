import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import EditarAbono from './editarAbono';
import { createApiUrl } from "@/config/api";
import { 
  DollarSign, 
  Calendar, 
  Package, 
  User, 
  Phone, 
  X, 
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  price: number;
  custormerId: number;
  status: string;
  debt: number;
  createdAt: string;
  name: string;
  customer: Customer;
}

interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  purchaseId: number;
  purchase: Purchase;
}

interface VerAbonosProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number;
}

const VerAbonos: React.FC<VerAbonosProps> = ({ isOpen, onClose, purchaseId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAbonoId, setSelectedAbonoId] = useState<number | null>(null);
  const [selectedAbonoAmount, setSelectedAbonoAmount] = useState<number>(0);
  const [isEditAbonoModalOpen, setIsEditAbonoModalOpen] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchPayments = async () => {
    if (!purchaseId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(createApiUrl('/abonos/abonocompra', purchaseId.toString()));
      if (!response.ok) {
        throw new Error('Error al cargar los abonos');
      }
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    setIsDeletingPayment(paymentId);
    try {
      const response = await fetch(createApiUrl('/abonos', paymentId.toString()), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el abono');
      }
      
      // Refresh the payments list
      await fetchPayments();
      setShowDeleteConfirm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar el abono');
    } finally {
      setIsDeletingPayment(null);
    }
  };

  const handleEditAbono = (paymentId: number, amount: number) => {
    setSelectedAbonoId(paymentId);
    setSelectedAbonoAmount(amount);
    setIsEditAbonoModalOpen(true);
  };

  const handleUpdateAfterEdit = async () => {
    await fetchPayments();
    onClose(); // Cerrar el modal después de actualizar
  };

  useEffect(() => {
    fetchPayments();
  }, [purchaseId]);

  if (!isOpen) return null;

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = () => {
    if (!payments.length || !payments[0]?.purchase) return 0;
    const totalPrice = payments[0].purchase.price;
    const totalPaid = getTotalPayments();
    return totalPrice - totalPaid;
  };

  return (
    <>
      <Modal 
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        backdrop="blur"
        className="w-full max-w-2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Historial de Abonos
                  </h2>
                </div>
              </ModalHeader>

              <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : error ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded-lg flex items-center gap-2">
                    <X className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Purchase Info */}
                    {payments[0]?.purchase && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package size={18} className="opacity-80" />
                              <span>{payments[0].purchase.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={18} className="opacity-80" />
                              <span>{payments[0].purchase.customer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={18} className="opacity-80" />
                              <span>{payments[0].purchase.customer.phone}</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <p className="text-white/80">Valor total</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(payments[0].purchase.price)}
                            </p>
                            <div className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-2
                              ${payments[0].purchase.status === 'pendiente' 
                                ? 'bg-yellow-500/20 text-yellow-100'
                                : 'bg-green-500/20 text-green-100'
                              }`}>
                              <span className="w-2 h-2 rounded-full bg-current" />
                              <span className="text-sm font-medium">
                                {payments[0].purchase.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payments List */}
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <DollarSign className="text-blue-500" size={20} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar size={14} />
                                  <span>
                                    {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditAbono(payment.id, payment.amount);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Editar abono"
                              >
                                <Edit size={18} className="text-amber-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAbonoId(payment.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Eliminar abono"
                                disabled={isDeletingPayment === payment.id}
                              >
                                {isDeletingPayment === payment.id ? (
                                  <Loader2 size={18} className="text-red-600 animate-spin" />
                                ) : (
                                  <Trash2 size={18} className="text-red-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="border-t border-gray-100 pt-4">
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total abonado</span>
                    <span className="text-xl font-semibold text-green-600">
                      {formatCurrency(getTotalPayments())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Saldo pendiente</span>
                    <span className="text-xl font-semibold text-red-600">
                      {formatCurrency(getRemainingBalance())}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">Valor total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {payments[0]?.purchase ? formatCurrency(payments[0].purchase.price) : '-'}
                    </span>
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {selectedAbonoId !== null && (
        <EditarAbono
          isOpen={isEditAbonoModalOpen}
          onClose={() => {
            setIsEditAbonoModalOpen(false);
            setSelectedAbonoId(null);
            handleUpdateAfterEdit();
          }}
          abonoId={selectedAbonoId}
          purchaseId={purchaseId}
          currentAmount={selectedAbonoAmount}
          currentDate={new Date().toISOString()}
          onUpdate={handleUpdateAfterEdit}
        />
      )}

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="sm"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar eliminación
                </h3>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-600">
                  ¿Estás seguro que deseas eliminar este abono? Esta acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => selectedAbonoId && handleDeletePayment(selectedAbonoId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={isDeletingPayment !== null}
                  >
                    {isDeletingPayment !== null ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default VerAbonos;