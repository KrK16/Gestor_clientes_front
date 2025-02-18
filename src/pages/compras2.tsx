import React, { useState, useEffect } from "react";
import { User, ShoppingBag, Phone, Calendar, DollarSign, Package, Plus, Search, Edit, Trash } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import EliminarCompra from "@/components/eliminarCompra";
import AgregarCompra from "@/components/agregarCompra";
import EditarCompra from "@/components/editarCompra";

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

const Compritas2: React.FC = () => {
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

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch("http://localhost:3000/compras");
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate totalDebt per customer
  const calculateCustomerDebt = (customerPurchases: Purchase[]) => {
    return customerPurchases.reduce((total, purchase) => total + purchase.debt, 0);
  };

  const pagarTodo = async (id: number) => {
    const response = await fetch (`http://localhost:3000/abonos/abonoTotal/${id}`, {
      method: "GET",
      headers  : { "Content-Type": "application/json" },
    });
    window.location.reload();
  }
  
  // Update the customStyles with new glass effect
  const customStyles = `
  @layer utilities {
    .glass-morphism {
      @apply bg-white/90 backdrop-blur-lg border border-gray-200 shadow-lg;
    }
    .glass-card {
      @apply bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-lg shadow-xl;
    }
    .custom-scrollbar {
      @apply scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400;
    }
    .card-hover {
      @apply transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:transform hover:-translate-y-1;
    }
  }
  `;

  const colors = {
    primary: {
      light: '#EEF2FF',
      DEFAULT: '#4F46E5',
      dark: '#4338CA'
    },
    success: {
      light: '#ECFDF5',
      DEFAULT: '#10B981',
      dark: '#059669'
    },
    warning: {
      light: '#FFFBEB',
      DEFAULT: '#F59E0B',
      dark: '#D97706'
    },
    danger: {
      light: '#FEF2F2',
      DEFAULT: '#EF4444',
      dark: '#DC2626'
    }
  };

  // Add these modern gradients at the top of your component
  const gradients = {
    primary: 'from-blue-500 to-indigo-500',
    success: 'from-emerald-500 to-teal-500',
    warning: 'from-amber-500 to-orange-500',
    header: 'from-slate-700 to-slate-900'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-10">
      {/* Header Mejorado */}
      <div className="sticky top-0 z-50 glass-morphism">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h1 className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Gestión de Clientes
              </h1>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 
                       hover:shadow-blue-500/40 border-none px-6 h-11 rounded-xl font-medium"
              onPress={() => setIsAddModalOpen(true)}
              startContent={<Plus className="h-5 w-5" />}
            >
              Nueva Compra
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="glass-morphism rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 
                           focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar Compras</label>
                  <select
                    value={selectedPurchaseName}
                    onChange={(e) => setSelectedPurchaseName(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 focus:ring-2 
                             focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Todas las compras</option>
                    {Array.from(new Set(purchases.map((purchase) => purchase.name))).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 focus:ring-2 
                             focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Clientes Mejoradas */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.values(groupedPurchases).map(({ customer, purchases }) => (
            <div key={customer.id} className="rounded-2xl overflow-hidden card-hover bg-white shadow-lg border border-gray-100">
              {/* Customer Header - Better contrast */}
              <div className="glass-card p-6 bg-black">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center">
                    <User className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone size={14} />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards - Enhanced */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-gray-300 text-sm font-medium mb-1">Deuda Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(calculateCustomerDebt(purchases))}
                    </p>
                  </div>
                  <button
                    onClick={() => pagarTodo(customer.id)}
                    className="bg-emerald-500/20 rounded-xl p-4 hover:bg-emerald-500/30 
                             transition-all duration-300 flex flex-col items-center justify-center gap-1"
                  >
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Pagar Todo</span>
                  </button>
                </div>
              </div>

              {/* Purchase History Section - Enhanced */}
              <div className="bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-indigo-600" size={20} />
                    <h4 className="font-semibold text-gray-900">Historial de Compras</h4>
                  </div>
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-full">
                    {purchases.length} compras
                  </span>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredPurchases.map((purchase) => (
                    <div key={purchase.id} 
                         className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 
                                  transition-all duration-200 border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">{purchase.name}</h5>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${purchase.status === "pagado" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-700"}`}>
                          {purchase.status}
                        </span>
                      </div>

                      <p className="text-xl font-bold text-indigo-600 mb-4">
                        {formatCurrency(purchase.price)}
                      </p>

                      {/* Action Buttons - Enhanced */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(purchase)}
                          className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg 
                                   hover:bg-indigo-100 transition-all duration-200 text-sm 
                                   font-medium flex items-center justify-center gap-2"
                        >
                          <Package size={16} />
                          Ver Productos
                        </button>
                        <button
                          onClick={() => {
                            setPurchaseToEdit(purchase);
                            setIsEditModalOpen(true);
                          }}
                          className="flex-1 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg 
                                   hover:bg-amber-100 transition-all duration-200 text-sm 
                                   font-medium flex items-center justify-center gap-2"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setPurchaseToDelete(purchase.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg 
                                   hover:bg-red-100 transition-all duration-200 text-sm 
                                   font-medium flex items-center justify-center gap-2"
                        >
                          <Trash size={16} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPurchase && (
        <Modal backdrop="blur" isOpen={isOpen} onClose={onClose}>
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
    </div>
  );
};

function useDisclosure() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return { isOpen, onOpen, onClose };
}

export default Compritas2;