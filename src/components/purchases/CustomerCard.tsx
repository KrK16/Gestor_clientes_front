import React, { useState } from "react";
import {
  User,
  Phone,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

import { CustomerWithPurchases } from "@/types/purchases";
import EstadoCuenta from "@/components/EstadoCuenta";

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
  const { customer } = customerWithPurchases;
  const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);

  // Validación de seguridad
  if (!customer || !customer.id) {
    return null;
  }

  return (
    <div className="mb-4">
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-teal-400 p-3 rounded-full">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {customer.name}
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-500 mt-1">
                <div className="flex items-center">
                  <Phone className="mr-1" size={16} />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1" size={16} />
                  <span className="text-sm">
                    Desde: {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid grid-cols-2 sm:flex sm:gap-6 w-full sm:w-auto">
              <div className="text-center">
                <p className="text-sm text-gray-500">Compras</p>
                <span className="text-xl font-bold text-blue-600">
                  {purchaseCount}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Deuda Total</p>
                <span className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })
                    .format(totalDebt)
                    .replace(/,00$/, "")}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2
                         rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEstadoOpen(true);
                }}
              >
                <FileText size={20} />
                <span>Estado de cuenta</span>
              </button>
              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2
                         rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayAll(customer.id);
                }}
              >
                <DollarSign size={20} />
                <span>Pagar Todo</span>
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 
                         rounded-lg transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
              >
                <ExpandIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <EstadoCuenta
        customerId={customer.id}
        customerName={customer.name}
        isOpen={isEstadoOpen}
        onClose={() => setIsEstadoOpen(false)}
      />
    </div>
  );
};

export default CustomerCard;
