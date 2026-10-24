import React, { useState, useEffect } from "react";
import { ShoppingBag, Plus } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
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
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(
    null,
  );
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isAbonosModalOpen, setIsAbonosModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(
    null,
  );
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
    applyExternalFilter,
    formatCurrency,
    getCustomerPurchaseCount,
    getCustomerTotalDebt,
  } = usePurchases();

  const {
    filters,
    filteredPurchases: searchFiltered,
    updateFilter,
    clearFilters,
    getUniquePurchaseNames,
    getUniqueStatuses,
  } = useFilters(purchases);

  useEffect(() => {
    applyExternalFilter(searchFiltered);
  }, [searchFiltered, applyExternalFilter]);

  const handleAddAndReveal = (purchase: Purchase) => {
    handleAddPurchase(purchase);
    clearFilters();
  };

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
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                onPress={() => setIsAddModalOpen(true)}
              >
                <span className="hidden sm:inline">Nueva Compra</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
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
          uniquePurchaseNames={getUniquePurchaseNames()}
          uniqueStatuses={getUniqueStatuses()}
          onPurchaseNameChange={(value) =>
            updateFilter("selectedPurchaseName", value)
          }
          onSearchChange={(value) => updateFilter("searchTerm", value)}
          onStatusChange={(value) => updateFilter("selectedStatus", value)}
        />

        {/* Customer Cards */}
        <div className="max-w-7xl mx-auto px-6">
          {Object.values(groupedPurchases).map((customerWithPurchases) => {
            const isExpanded =
              expandedCustomerId === customerWithPurchases.customer.id;
            const totalDebt = getCustomerTotalDebt(
              customerWithPurchases.customer.id,
            );
            const purchaseCount = getCustomerPurchaseCount(
              customerWithPurchases.customer.id,
            );

            return (
              <div key={customerWithPurchases.customer.id}>
                <CustomerCard
                  customerWithPurchases={customerWithPurchases}
                  isExpanded={isExpanded}
                  purchaseCount={purchaseCount}
                  totalDebt={totalDebt}
                  onPayAll={handlePayAll}
                  onToggle={() =>
                    setExpandedCustomerId(
                      isExpanded ? null : customerWithPurchases.customer.id,
                    )
                  }
                />

                {isExpanded && (
                  <PurchaseList
                    actions={purchaseActions}
                    formatCurrency={formatCurrency}
                    purchases={customerWithPurchases.purchases}
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
          className="w-[95vw] max-w-[600px] mx-auto"
          isOpen={isOpen}
          onClose={onClose}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Detalles de la Compra
                </ModalHeader>
                <ModalBody>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <ShoppingBag size={20} />
                    <p>
                      <strong>Nombre:</strong> {selectedPurchase.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span>
                      <strong>Precio:</strong>{" "}
                      {formatCurrency(selectedPurchase.price)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span>
                      <strong>Estado:</strong> {selectedPurchase.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span>
                      <strong>Fecha de Creación:</strong>{" "}
                      {new Date(
                        selectedPurchase.orderdate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <span>
                      <strong>Fecha de Pago:</strong>{" "}
                      {new Date(selectedPurchase.payday).toLocaleDateString()}
                    </span>
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
                            <td className="py-2 px-4">
                              {formatCurrency(product.price)}
                            </td>
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
          purchaseId={purchaseToDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeletePurchase}
        />
      )}

      <AgregarCompra
        isOpen={isAddModalOpen}
        onAdd={handleAddAndReveal}
        onClose={() => setIsAddModalOpen(false)}
      />

      {purchaseToEdit && (
        <EditarCompra
          isOpen={isEditModalOpen}
          purchase={purchaseToEdit}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdatePurchase}
        />
      )}

      {selectedPurchaseId !== null && (
        <VerAbonos
          isOpen={isAbonosModalOpen}
          purchaseId={selectedPurchaseId}
          onClose={() => {
            setIsAbonosModalOpen(false);
            updatePurchaseData();
          }}
        />
      )}

      {selectedAbonoId !== null && (
        <EditarAbono
          abonoId={selectedAbonoId}
          currentAmount={0}
          currentDate={new Date().toISOString()}
          isOpen={isEditAbonoModalOpen}
          purchaseId={selectedPurchaseId || 0}
          onClose={() => {
            setIsEditAbonoModalOpen(false);
            updatePurchaseData();
          }}
          onUpdate={() => {
            updatePurchaseData();
          }}
        />
      )}

      {selectedPurchaseId !== null && (
        <AgregarAbono
          isOpen={isAbonoModalOpen}
          purchaseId={selectedPurchaseId}
          onAdd={handleAddAbono}
          onClose={() => {
            setIsAbonoModalOpen(false);
            handleAddAbono();
          }}
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
