import React from 'react';
import { Package, DollarSign, Calendar, Plus, Edit, Trash } from 'lucide-react';
import { Tooltip } from '@heroui/tooltip';
import { Purchase, PurchaseActions } from '@/types/purchases';
import InvoiceGenerator from '@/components/InvoiceGenerator';

interface PurchaseListProps {
  purchases: Purchase[];
  formatCurrency: (value: number) => string;
  actions: PurchaseActions;
}

const PurchaseList: React.FC<PurchaseListProps> = ({
  purchases,
  formatCurrency,
  actions,
}) => {
  return (
    <div className="mt-4 bg-gray-50 rounded-lg p-4 sm:p-6 transition-all duration-300">
      <div className="grid grid-cols-1 gap-4">
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg sm:text-xl font-semibold text-gray-800">{purchase.name}</h4>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium 
                    ${purchase.status === "pagado" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {purchase.status === "pagado" ? "✓ Pagado" : "⏳ Pendiente"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={16} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha</p>
                      <p className="text-sm font-medium">{new Date(purchase.orderdate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <DollarSign size={16} className="text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Precio total</p>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(purchase.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <DollarSign size={16} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Deuda pendiente</p>
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(purchase.debt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6"></div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <Tooltip content="Ver detalles">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.handleViewDetails(purchase);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                           bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                >
                  <Package size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Ver</span>
                </button>
              </Tooltip>

              <Tooltip content="Descargar factura">
                <InvoiceGenerator purchase={purchase} />
              </Tooltip>

              <Tooltip content="Historial de abonos">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.setSelectedPurchaseId(purchase.id);
                    actions.setIsAbonosModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                           bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                >
                  <DollarSign size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Historial</span>
                </button>
              </Tooltip>

              <Tooltip content="Nuevo abono">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.openAbonoModal(purchase.id);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                           bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                >
                  <Plus size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Abonar</span>
                </button>
              </Tooltip>

              <Tooltip content="Modificar compra">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.setPurchaseToEdit(purchase);
                    actions.setIsEditModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                           bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                >
                  <Edit size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Editar</span>
                </button>
              </Tooltip>

              <Tooltip content="Eliminar compra">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.setPurchaseToDelete(purchase.id);
                    actions.setIsDeleteModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                           bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Borrar</span>
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseList;