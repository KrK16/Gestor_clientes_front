import React, { useState, useEffect } from "react";
import { DollarSign, Calendar, Package, ArrowDown, User } from "lucide-react";
import { createApiUrl } from "@/config/api";

interface Customer {
  id: number;
  name: string;
}

interface Payment {
  id: number;
  amount: number;
  createdAt: string;
  purchaseId: number;
}

interface GroupedPayments {
  customer: Customer;
  payments: Payment[];
}

const Abonos: React.FC = () => {
  const [groupedPayments, setGroupedPayments] = useState<GroupedPayments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  const getTotalPayments = () => {
    return groupedPayments.reduce((total, group) => 
      total + group.payments.reduce((sum, payment) => sum + payment.amount, 0), 0
    );
  }

  const getTotalPaymentsCount = () => {
    return groupedPayments.reduce((total, group) => total + group.payments.length, 0);
  }

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(createApiUrl('/abonos/abonosagrupados'));
        if (!response.ok) {
          throw new Error('Error al cargar los abonos');
        }
        const data = await response.json();
        setGroupedPayments(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-500/20"></div>
          <p className="text-gray-500">Cargando abonos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
            <h1 className="text-2xl font-semibold text-gray-800">Historial de Abonos</h1>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl"></div>
                <DollarSign className="text-blue-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total de abonos</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(getTotalPayments())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                <Package className="text-emerald-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Número de abonos</p>
                  <p className="text-xl font-semibold text-gray-900">{getTotalPaymentsCount()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <User className="text-purple-500" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total clientes</p>
                  <p className="text-xl font-semibold text-gray-900">{groupedPayments.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Payments List */}
        <div className="space-y-6">
          {groupedPayments.map((group) => (
            <div key={group.customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <User size={20} />
                  <h2 className="text-lg font-medium">{group.customer.name}</h2>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {group.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <ArrowDown className="text-blue-500" size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
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
                      <div className="bg-gray-50 px-3 py-1 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Compra #{payment.purchaseId}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total abonos del cliente</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(group.payments.reduce((sum, payment) => sum + payment.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};

export default Abonos;