import React, { useState } from "react";
import { ShoppingBag, Plus, User, Calendar, DollarSign } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Purchase } from "@/types/purchases";
import { usePurchases } from "@/hooks/usePurchases";
import { useFilters } from "@/hooks/useFilters";

import EliminarCompra from "@/components/eliminarCompra";
import AgregarCompra from "@/components/agregarCompra";
import EditarCompra from "@/components/editarCompra";
import VerAbonos from "@/components/abonosdecompra";
import AgregarAbono from "@/components/agregarAbono";
import EditarAbono from "@/components/editarAbono";

import CustomerCard from "@/components/purchases/CustomerCard";
import PurchaseList from "@/components/purchases/PurchaseList";
import FilterBar from "@/components/purchases/FilterBar";

const Compritas: React.FC = () => {
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isAbonosModalOpen, setIsAbonosModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isEditAbonoModalOpen, setIsEditAbonoModalOpen] = useState(false);
  const [selectedAbonoId] = useState<number | null>(null);

  // Custom hooks
  const {
    purchases,
    loading,
    error,
    groupedPurchases,
    handleDeletePurchase,
    handleAddPurchase,
    handleUpdatePurchase,
    handlePayAll,
    refreshPurchases,
    formatCurrency,
    getCustomerPurchaseCount,
    getCustomerTotalDebt,
  } = usePurchases();

  const {
    filters,
    updateFilter,
    getUniquePurchaseNames,
    getUniqueStatuses,
  } = useFilters(purchases);

  // Event handlers
  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    onOpen();
  };

  const openAbonoModal = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setIsAbonoModalOpen(true);
  };

  const handleAddAbono = () => {
    refreshPurchases();
  };

  const updatePurchaseData = () => {
    refreshPurchases();
  };

  // Actions object for PurchaseList component
  const purchaseActions = {
    handleViewDetails,
    handleDeletePurchase,
    handleAddPurchase,
    handleUpdatePurchase,
    openAbonoModal,
    setSelectedPurchaseId,
    setIsAbonosModalOpen,
    setPurchaseToEdit,
    setIsEditModalOpen,
    setPurchaseToDelete,
    setIsDeleteModalOpen,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-10 flex items-center justify-center">
        <div className="text-gray-600">Cargando compras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-10 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-10">
      <style>{customStyles}</style>
      
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - Title and Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Gestión de Clientes
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Administra compras y abonos de forma eficiente
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - CTA Button */}
            <div className="flex items-center space-x-3">
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 
                         hover:shadow-blue-500/40 border-none px-6 py-3 rounded-xl font-semibold
                         transition-all duration-300 hover:scale-[1.03] hover:from-blue-700 hover:to-blue-600
                         active:scale-[0.98]"
                onPress={() => setIsAddModalOpen(true)}
                startContent={<Plus className="h-5 w-5" />}
                size="lg"
              >
                <span className="hidden sm:inline">Nueva Compra</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Clientes</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {Object.keys(groupedPurchases).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Compras</p>
                  <p className="text-xl font-bold text-green-900 mt-1">
                    {purchases.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Pendientes</p>
                  <p className="text-xl font-bold text-yellow-900 mt-1">
                    {purchases.filter(p => p.status === 'pendiente').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Deuda Total</p>
                  <p className="text-xl font-bold text-purple-900 mt-1">
                    {formatCurrency(
                      purchases
                        .filter(p => p.status === 'pendiente')
                        .reduce((sum, p) => sum + (p.debt || 0), 0)
                    )}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <FilterBar
          searchTerm={filters.searchTerm}
          selectedPurchaseName={filters.selectedPurchaseName}
          selectedStatus={filters.selectedStatus}
          onSearchChange={(value) => updateFilter('searchTerm', value)}
          onPurchaseNameChange={(value) => updateFilter('selectedPurchaseName', value)}
          onStatusChange={(value) => updateFilter('selectedStatus', value)}
          uniquePurchaseNames={getUniquePurchaseNames()}
          uniqueStatuses={getUniqueStatuses()}
        />

        {/* Customer Cards */}
        <div className="max-w-7xl mx-auto px-6">
          {Object.values(groupedPurchases).map((customerWithPurchases) => {
            const isExpanded = expandedCustomerId === customerWithPurchases.customer.id;
            const totalDebt = getCustomerTotalDebt(customerWithPurchases.customer.id);
            const purchaseCount = getCustomerPurchaseCount(customerWithPurchases.customer.id);

            return (
              <div key={customerWithPurchases.customer.id}>
                <CustomerCard
                  customerWithPurchases={customerWithPurchases}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedCustomerId(isExpanded ? null : customerWithPurchases.customer.id)}
                  totalDebt={totalDebt}
                  purchaseCount={purchaseCount}
                  onPayAll={handlePayAll}
                />

                {isExpanded && (
                  <PurchaseList
                    purchases={customerWithPurchases.purchases}
                    formatCurrency={formatCurrency}
                    actions={purchaseActions}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {selectedPurchase && (
        <Modal 
          backdrop="blur" 
          isOpen={isOpen} 
          onClose={onClose}
          className="w-[95vw] max-w-[600px] mx-auto"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Detalles de la Compra</ModalHeader>
                <ModalBody>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <ShoppingBag size={20} />
                    <p><strong>Nombre:</strong> {selectedPurchase.name}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span><strong>Precio:</strong> {formatCurrency(selectedPurchase.price)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span><strong>Estado:</strong> {selectedPurchase.status}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span><strong>Fecha de Creación:</strong> {new Date(selectedPurchase.orderdate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-semibold mt-4">Productos</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2">Producto</th>
                          <th className="py-2">Cantidad</th>
                          <th className="py-2">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPurchase.products.map((product) => (
                          <tr key={product.id} className="border-t">
                            <td className="py-2 px-4">{product.name}</td>
                            <td className="py-2 px-4">{product.quantity}</td>
                            <td className="py-2 px-4">{formatCurrency(product.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cerrar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}

      {purchaseToDelete !== null && (
        <EliminarCompra
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          purchaseId={purchaseToDelete}
          onDelete={handleDeletePurchase}
        />
      )}

      <AgregarCompra
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddPurchase}
      />

      {purchaseToEdit && (
        <EditarCompra
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          purchase={purchaseToEdit}
          onUpdate={handleUpdatePurchase}
        />
      )}

      {selectedPurchaseId !== null && (
        <VerAbonos
          isOpen={isAbonosModalOpen}
          onClose={() => {
            setIsAbonosModalOpen(false);
            updatePurchaseData();
          }}
          purchaseId={selectedPurchaseId}
        />
      )}

      {selectedAbonoId !== null && (
        <EditarAbono
          isOpen={isEditAbonoModalOpen}
          onClose={() => {
            setIsEditAbonoModalOpen(false);
            updatePurchaseData();
          }}
          abonoId={selectedAbonoId}
          purchaseId={selectedPurchaseId || 0}
          currentAmount={0}
          currentDate={new Date().toISOString()}
          onUpdate={() => {
            updatePurchaseData();
          }}
        />
      )}

      {selectedPurchaseId !== null && (
        <AgregarAbono
          isOpen={isAbonoModalOpen}
          onClose={() => {
            setIsAbonoModalOpen(false);
            handleAddAbono();
          }}
          onAdd={handleAddAbono}
          purchaseId={selectedPurchaseId}
        />
      )}
    </div>
  );
};

const customStyles = `
  @layer utilities {
    /* Existing styles remain */
    
    @media (max-width: 640px) {
      .container {
        @apply px-4;
      }
      
      .card {
        @apply rounded-lg p-4;
      }
      
      .table-container {
        @apply overflow-x-auto -mx-4 sm:mx-0;
      }
    }
    
    /* Animations for stats */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .stat-card {
      animation: slideIn 0.5s ease-out;
      animation-fill-mode: both;
    }
    
    .stat-card:nth-child(1) { animation-delay: 0.1s; }
    .stat-card:nth-child(2) { animation-delay: 0.2s; }
    .stat-card:nth-child(3) { animation-delay: 0.3s; }
    .stat-card:nth-child(4) { animation-delay: 0.4s; }
  }
`;

function useDisclosure() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return { isOpen, onOpen, onClose };
}

export default Compritas;