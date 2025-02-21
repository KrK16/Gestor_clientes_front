import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Plus, Trash2, User, UserPlus } from "lucide-react";

interface AgregarCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (purchase: any) => void;
}

interface Cliente {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

const AgregarCompra: React.FC<AgregarCompraProps> = ({ isOpen, onClose, onAdd }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [products, setProducts] = useState<{ name: string; quantity: string; price: string }[]>([
    { name: "", quantity: "", price: "" },
  ]);
  const [payday, setPayday] = useState<string>("");
  const [orderdate, setOrderdate] = useState<string>("");
  const [formattedprice, setFormattedprice] = useState<string>('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("http://26.241.225.40:3000/clientes");
        const data: Cliente[] = await response.json();
        setClientes(data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    };
    fetchClientes();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Modificar el handleAmountChange para incluir el índice del producto
  const handleAmountChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');

    if (value) {
      const numberValue = Number(value);
      const formattedValue = formatCurrency(numberValue);

      // Actualizar el precio del producto específico
      handleProductChange(index, "price", value); // Guardamos el valor numérico
      setFormattedprice(formattedValue);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormattedprice('');
    }
  }, [isOpen]);

  const handleAddProduct = () => {
    setProducts([...products, { name: "", quantity: "", price: "" }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleSubmit = async () => {
    try {
      const url = isNewClient ? "http://26.241.225.40:3000/compras/compraNCliente" : "http://26.241.225.40:3000/compras";


      const body = isNewClient
        ? {
          name: customerName,
          phone: customerPhone,
          nameCompra: name,
          payday: payday,
          // Changed from payDay to payday
          orderdate: orderdate,   // Changed from orderDay to orderdate
          productos: products.map(product => ({
            ...product,
            quantity: Number(product.quantity),
            price: Number(product.price)
          })),
        }
        : {
          customer_id: customerId,
          name,
          payday: payday,        // Changed from payDay to payday
          orderdate: orderdate,   // Changed from orderDay to orderdate
          productos: products.map(product => ({
            ...product,
            quantity: Number(product.quantity),
            price: Number(product.price)
          })),
        };
      console.log(body);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newPurchase = await response.json();
        onAdd(newPurchase);
        onClose();
        window.location.reload();
      } else {
        console.error("Error adding purchase:", response.statusText);
      }

    } catch (error) {
      console.error("Error adding purchase:", error);
    }
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      className="h-auto h-max-[90%vh]"
    >
      <ModalContent className="my-8 max-h-[90vh]">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
                <h2 className="text-xl font-medium text-gray-800">Agregar Compra</h2>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Client Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsNewClient(false)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${!isNewClient
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                      <User size={16} />
                      Cliente Existente
                    </button>
                    <button
                      onClick={() => setIsNewClient(true)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${isNewClient
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                      <UserPlus size={16} />
                      Cliente Nuevo
                    </button>
                  </div>
                </div>

                {isNewClient ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nombre del Cliente</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                                 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 transition-all duration-200"
                        placeholder="Ingrese el nombre del cliente"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                                 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 transition-all duration-200"
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Seleccionar Cliente</label>
                    <select
                      value={customerId ?? ""}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Fecha de Pago</label>
                    <input
                      type="date"
                      value={payday}
                      onChange={(e) => setPayday(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Fecha de Pedido</label>
                    <input
                      type="date"
                      value={orderdate}
                      onChange={(e) => setOrderdate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Purchase Name Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre de la Compra</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                             transition-all duration-200"
                    placeholder="Ingrese el nombre de la compra"
                  />
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="sticky top-0 bg-white z-10 pb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">Productos</h3>
                  <Button
                    color="primary"
                    onPress={handleAddProduct}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl
                             transition-all duration-200 flex items-center gap-2 hover:scale-105"
                  >
                    <Plus size={16} />
                    Agregar Producto
                  </Button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50
                               hover:border-gray-200 transition-all duration-200
                               hover:shadow-lg hover:shadow-gray-100/50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <h4 className="font-medium text-gray-700">Producto {index + 1}</h4>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 
                                   transition-colors group"
                        >
                          <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600">Nombre</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(index, "name", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     transition-all duration-200"
                            placeholder="Nombre del producto"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600">Cantidad</label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     transition-all duration-200"
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600">Precio</label>
                          <input
                            type="text"
                            value={product.price ? formatCurrency(Number(product.price)) : ''} // Mostrar el precio formateado
                            onChange={(e) => handleAmountChange(index, e)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
             transition-all duration-200"
                            placeholder="$0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-gray-100 p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="light"
                  onPress={onClose}
                  className="px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white 
                           px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 
                           hover:shadow-blue-500/40 transition-all duration-300"
                >
                  Crear Compra
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AgregarCompra;