import React, { useState, useEffect } from "react";
import { User, ShoppingBag, Phone, Calendar, DollarSign, Package, Search, Plus, Edit, Trash } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Tooltip } from "@heroui/tooltip";

import { Button } from "@heroui/button";
import EliminarCompra from "@/components/eliminarCompra";
import AgregarCompra from "@/components/agregarCompra";
import EditarCompra from "@/components/editarCompra";
import VerAbonos from "@/components/abonosdecompra";
import AgregarAbono from "@/components/agregarAbono";



interface Product {
  id: number;
  name: string;
  purchaseId: number;
  quantity: number;
  price: number;
  createdAt: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

interface Purchase {
  id: number;
  price: number;
  customerId: number;
  status: string;
  debt: number;
  createdAt: string;
  name: string;
  products: Product[];
  customer: Customer;

}


const Compritas: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPurchaseName, setSelectedPurchaseName] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isAbonosModalOpen, setIsAbonosModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
// Primero, añade este nuevo estado al componente Compritas
const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);

// Luego, modifica la sección del renderizado de las cards:
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);

  const [isEditAbonoModalOpen, setIsEditAbonoModalOpen] = useState(false);
  const [selectedAbonoId, setSelectedAbonoId] = useState<number | null>(null);
  const [selectedAbonoAmount, setSelectedAbonoAmount] = useState<number>(0);


  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch("http://26.241.225.40:3000/compras");
        const data: Purchase[] = await response.json();
        setPurchases(data);
        setFilteredPurchases(data);
      } catch (error) {
        console.error("Error al obtener compras:", error);
      }
    };
    fetchPurchases();
  }, []);

  useEffect(() => {
    const filtered = purchases.filter((purchase) => {
      const matchesSearchTerm = purchase.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPurchaseName = selectedPurchaseName ? purchase.name === selectedPurchaseName : true;
      const matchesStatus = selectedStatus ? purchase.status === selectedStatus : true;
      return matchesSearchTerm && matchesPurchaseName && matchesStatus;
    });
    setFilteredPurchases(filtered);
  }, [searchTerm, selectedPurchaseName, selectedStatus, purchases]);

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    onOpen();
  };

  const handleDeletePurchase = (id: number) => {
    setPurchases(purchases.filter((purchase) => purchase.id !== id));
    setFilteredPurchases(filteredPurchases.filter((purchase) => purchase.id !== id));
  };

  const handleAddPurchase = (newPurchase: Purchase) => {
    setPurchases([...purchases, newPurchase]);
    setFilteredPurchases([...filteredPurchases, newPurchase]);
  };

  const handleUpdatePurchase = (updatedPurchase: Purchase) => {
    const updatedPurchases = purchases.map((purchase) =>
      purchase.id === updatedPurchase.id ? updatedPurchase : purchase
    );
    setPurchases(updatedPurchases);
    setFilteredPurchases(updatedPurchases);
  };

  const groupedPurchases = filteredPurchases.reduce((acc, purchase) => {
    const customerId = purchase.customer.id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: purchase.customer,
        purchases: [],
      };
    }
    acc[customerId].purchases.push(purchase);
    return acc;
  }, {} as Record<number, { customer: Customer; purchases: Purchase[] }>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value).replace(/,00$/, '');
  };

  const pagarTodo = async (id: number) => {
    const response = await fetch(`http://26.241.225.40:3000/abonos/abonoTotal/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    window.location.reload();
  }

  const contadorCompras = (id: number) => {
    let contador = 0;
    //Compras obtenidas de la API
    purchases.map((purchase) => {
      //Si el id del cliente es igual al id del cliente de la compra
      if (purchase.customer.id === id) {
        //Aumentar el contador de cada compra
        contador++;
      }
    });

    return contador
  }

  const handleAddAbono = (abono: any) => {
    // Lógica para manejar el abono agregado
    console.log("Abono agregado:", abono);
  };

  const openAbonoModal = (purchaseId: number) => {
    setSelectedPurchaseId(purchaseId);
    setIsAbonoModalOpen(true);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-10">
      <style>{customStyles}</style>
      <div className=" top-0 z-50 glass-morphism">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <div className="flex  sm:flex-row justify-between flex-start items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h1 className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Gestión de Clientes
              </h1>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 
                       hover:shadow-blue-500/40 border-none px-6 h-11 rounded-xl font-medium
                       transition-all duration-300 hover:scale-[1.02]"
              onPress={() => setIsAddModalOpen(true)}
              startContent={<Plus className="h-5 w-5" />}
            >
              Nueva Compra
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="  gap-6">
          {/* Filtros y búsqueda */}
          <div className="mb-7 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Barra de búsqueda */}
              <div className="w-full">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Búsqueda</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-[0.5px] border-gray-200 rounded-lg focus:ring-focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro de Compras */}
              <div className="w-full">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar Compras</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedPurchaseName}
                    onChange={(e) => setSelectedPurchaseName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las compras</option>
                    {Array.from(new Set(purchases.map((purchase) => purchase.name))).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtro de Estado */}
              <div className="w-full">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6">
  {Object.values(groupedPurchases).map(({ customer, purchases }) => {
    const isExpanded = expandedCustomerId === customer.id;
    const totalDebt = purchases
      .filter((purchase) => purchase.status === "pendiente")
      .reduce((sum, purchase) => sum + purchase.debt, 0);

    return (
      <div key={customer.id} className="mb-4">
        {/* Card Principal del Cliente - Horizontal */}
        <div 
          onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 gap-4">
            {/* Información del Cliente */}
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

            {/* Información de Deuda y Contador */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="grid grid-cols-2 sm:flex sm:gap-6 w-full sm:w-auto">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Compras</p>
                  <span className="text-xl font-bold text-blue-600">{contadorCompras(customer.id)}</span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Deuda Total</p>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(totalDebt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pagarTodo(customer.id);
                }}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 
                         rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <DollarSign size={20} />
                <span>Pagar Todo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel Expandible con las Compras */}
{isExpanded && (
  <div className="mt-4 bg-gray-50 rounded-lg p-4 sm:p-6 transition-all duration-300">
    <div className="grid grid-cols-1 gap-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            {/* Purchase Information */}
            <div className="space-y-4 w-full lg:w-auto">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-800">{purchase.name}</h4>
              <div className="flex flex-col space-y-2 text-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  <Calendar size={16} className="text-blue-500 shrink-0" />
                  <span className="font-medium shrink-0">Fecha:</span>
                  <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DollarSign size={16} className="text-green-500 shrink-0" />
                  <span className="font-medium shrink-0">Precio:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(purchase.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col items-start lg:items-end space-y-4 w-full lg:w-auto">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold w-full sm:w-auto text-center
                ${purchase.status === "pagado" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"}`}
              >
                {purchase.status === "pagado" ? "✓ Pagado" : "⏳ Pendiente"}
              </span>
              
              {/* Action Buttons */}
<div className="grid grid-cols-2 sm:flex flex-wrap gap-2 w-full lg:w-auto">
  <Tooltip content="Ver detalles">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleViewDetails(purchase);
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors
                 w-full sm:w-auto"
    >
      <Package size={16} className="shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">Ver</span>
    </button>
  </Tooltip>

  <Tooltip content="Historial de abonos">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedPurchaseId(purchase.id);
        setIsAbonosModalOpen(true);
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors
                 w-full sm:w-auto"
    >
      <DollarSign size={16} className="shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">Historial de abonos</span>
    </button>
  </Tooltip>

  <Tooltip content="Nuevo abono">
    <button
      onClick={(e) => {
        e.stopPropagation();
        openAbonoModal(purchase.id);
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors
                 w-full sm:w-auto"
    >
      <Plus size={16} className="shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">Añadir Abono</span>
    </button>
  </Tooltip>

  <Tooltip content="Modificar compra">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setPurchaseToEdit(purchase);
        setIsEditModalOpen(true);
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors
                 w-full sm:w-auto"
    >
      <Edit size={16} className="shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">Editar Compra</span>
    </button>
  </Tooltip>

  <Tooltip content="Eliminar compra">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setPurchaseToDelete(purchase.id);
        setIsDeleteModalOpen(true);
      }}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 
                 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors
                 w-full sm:w-auto col-span-2 sm:col-span-1"
    >
      <Trash size={16} className="shrink-0" />
      <span className="text-xs sm:text-sm font-medium truncate">Borrar</span>
    </button>
  </Tooltip>
</div>

            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    );
  })}
</div>
        </div>
      </div>

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
                    <Package size={20} />
                    <p><strong>Nombre:</strong> {selectedPurchase.name}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <DollarSign size={20} />
                    <p><strong>Precio:</strong> {formatCurrency(selectedPurchase.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <ShoppingBag size={20} />
                    <p><strong>Estado:</strong> {selectedPurchase.status}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Calendar size={20} />
                    <p><strong>Fecha de Creación:</strong> {new Date(selectedPurchase.createdAt).toLocaleString()}</p>
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
                            <td className="py-2 px-4"> Precio {formatCurrency(product.price)}</td>
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
          onClose={() => setIsAbonosModalOpen(false)}
          purchaseId={selectedPurchaseId}
        />

      )}
      {selectedAbonoId !== null && (
        <EditarAbono
          isOpen={isEditAbonoModalOpen}
          onClose={() => setIsEditAbonoModalOpen(false)}
          abonoId={selectedAbonoId}
          purchaseId={selectedPurchaseId || 0}
          currentAmount={selectedAbonoAmount}
          onUpdate={() => {
            // Refresh your data after update
            window.location.reload();
          }}
        />
      )}

      {selectedPurchaseId !== null && (
        <AgregarAbono
          isOpen={isAbonoModalOpen}
          onClose={() => setIsAbonoModalOpen(false)}
          onAdd={handleAddAbono}
          purchaseId={selectedPurchaseId}
        />
      )}

    </div>
  );
};

const customStyles = `
  @layer utilities {
    .glass-morphism {
      @apply bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm;
    }
    
    /* Mobile-first responsive styles */
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
  }
`;

function useDisclosure() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return { isOpen, onOpen, onClose };
}

export default Compritas;