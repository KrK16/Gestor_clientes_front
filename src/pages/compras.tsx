import React, { useState, useEffect } from "react";
import { User, ShoppingBag, Phone, Calendar, DollarSign, Package, Search, Plus, Edit, Trash } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import EliminarCompra from "@/components/eliminarCompra";
import AgregarCompra from "@/components/agregarCompra";
import EditarCompra from "@/components/editarCompra";
import { Tooltip } from "@heroui/tooltip";
import VerAbonos from "@/components/abonosdecompra";

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
const [isAbonoaddModalOpen, setIsAbonoaddModalOpen] = useState(false);


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
          <div className="mb-7 max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4 overflow-x-auto">
              {/* Barra de búsqueda */}
              <div className="min-w-[250px]">
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
              <div className="min-w-[250px]">
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
              <div className="min-w-[250px]">
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

          <div className="w-auto xl:max-w-[75%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6  pl-7 ">
            {Object.values(groupedPurchases).map(({ customer, purchases }) => {
              const filteredPurchases = selectedPurchaseName
                ? purchases.filter((purchase) => purchase.name === selectedPurchaseName)
                : purchases;
              const totalDebt = filteredPurchases
                .filter((purchase) => purchase.status === "pendiente")
                .reduce((sum, purchase) => sum + purchase.debt, 0);

              return (
                <div key={customer.id} className="bg-gray-50 rounded-xl shadow-md">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-t-xl ">
                    <div className="flex items-center space-x-4">
                      <User size={24} />
                      <span className="text-xl">{customer.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <Phone size={24} />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <Calendar size={24} />
                      <span>Cliente desde: {new Date(customer.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div style={{
                        height: "75%",
                        width: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",

                      }} className="  rounded-xl p-2">
                        <p className="text-gray-300 text-sm font-medium mb-1">Deuda Total</p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(totalDebt)}
                        </p>
                      </div>
                      <button
                        onClick={() => pagarTodo(customer.id)}
                         style={{
                          height: "75%",
                          width: "fit-content",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                        }} 
                        
                        className="bg-emerald-500 rounded-xl p-4 hover:bg-emerald-500/30 
                             transition-all duration-300 flex flex-col items-center justify-center gap-1"
                      >
                        
                        <DollarSign className="h-6 w-6 text-white" />
                        <span className="text-sm font-medium text-white">Pagar Todo</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
                        <h2 className="text-s font-semibold text-gray-800"> Compras realizadas</h2>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl">
                        {/* <ShoppingBag size={20} className="text-blue-600" /> */}
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                            {contadorCompras(customer.id)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {filteredPurchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="bg-white rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-semibold text-gray-700">{purchase.name}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${purchase.status === "pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              {purchase.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <ShoppingBag size={20} />
                              <span>ID: {purchase.id}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Calendar size={20} />
                              <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-xl font-bold text-blue-600">{formatCurrency(purchase.price)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Tooltip content="Ver detalles de productos">
                              <button
                                onClick={() => handleViewDetails(purchase)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5
                                         bg-blue-50 hover:bg-blue-100 text-blue-600
                                         rounded-lg transition-colors duration-200"
                              >
                                <Package size={23} />
                                <span className="text-xs font-medium">Ver Productos</span>
                              </button>
                            </Tooltip>
                            <Tooltip content="Ver abonos">
  <button
    onClick={() => {
      setSelectedPurchaseId(purchase.id);
      setIsAbonosModalOpen(true);
    }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5
             bg-purple-50 hover:bg-purple-100 text-purple-600
             rounded-lg transition-colors duration-200"
  >
    <DollarSign size={23} />
    <span className="text-xs font-medium">Ver Abonos</span>
  </button>
</Tooltip>


                            <Tooltip content="Editar compra">
                              <button
                                onClick={() => {
                                  setPurchaseToEdit(purchase);
                                  setIsEditModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5
                                         bg-amber-50 hover:bg-amber-100 text-amber-600
                                         rounded-lg transition-colors duration-200"
                              >
                                <Edit size={23} />
                                <span className="text-xs font-medium">Editar</span>
                              </button>
                            </Tooltip>

                            <Tooltip content="Eliminar compra">
                              <button
                                onClick={() => {
                                  setPurchaseToDelete(purchase.id);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5
                                         bg-red-50 hover:bg-red-100 text-red-600
                                         rounded-lg transition-colors duration-200"
                              >
                                <Trash size={23} />
                                <span className="text-xs font-medium">Eliminar</span>
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
      {selectedPurchaseId !== null && (
        <VerAbonos 
          isOpen={isAbonosModalOpen}
          onClose={() => setIsAbonosModalOpen(false)}
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
  }
`;

function useDisclosure() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return { isOpen, onOpen, onClose };
}

export default Compritas;