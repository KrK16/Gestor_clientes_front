import React from 'react';
import { User, Phone, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Customer, CustomerWithPurchases } from '@/types/purchases';

interface CustomerCardProps {
  customerWithPurchases: CustomerWithPurchases;
  isExpanded: boolean;
  onToggle: () => void;
  totalDebt: number;
  purchaseCount: number;
  onPayAll: (customerId: number) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customerWithPurchases,
  isExpanded,
  onToggle,
  totalDebt,
  purchaseCount,
  onPayAll,
}) => {
  const { customer, purchases } = customerWithPurchases;
  const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;
  
  // Validación de seguridad
  if (!customer || !customer.id) {
    console.warn('CustomerCard: Customer inválido', customerWithPurchases);
    return null;
  }

  return (
    <div className="mb-4">
      <div 
        onClick={onToggle}
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-teal-400 p-3 rounded-full">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{customer.name}</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-500 mt-1">
                <div className="flex items-center">
                  <Phone size={16} className="mr-1" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span className="text-sm">Desde: {new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid grid-cols-2 sm:flex sm:gap-6 w-full sm:w-auto">
              <div className="text-center">
                <p className="text-sm text-gray-500">Compras</p>
                <span className="text-xl font-bold text-blue-600">{purchaseCount}</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Deuda Total</p>
                <span className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('es-CO', { 
                    style: 'currency', 
                    currency: 'COP' 
                  }).format(totalDebt).replace(/,00$/, '')}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPayAll(customer.id);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 
                         rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <DollarSign size={20} />
                <span>Pagar Todo</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 
                         rounded-lg transition-colors duration-200"
              >
                <ExpandIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;