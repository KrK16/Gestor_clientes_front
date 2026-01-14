import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import {Trash2, Plus, Package, User, ShoppingBag, Calendar } from "lucide-react";
import { createApiUrl } from "@/config/api";

// Interfaces para los props y tipos de datos
interface EditarCompraProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: any;
  onUpdate: (updatedPurchase: any) => void;
}

interface Cliente {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

interface Producto {
  product_id: number;
  name: string;
  quantity: number;
  price: string;
}

// Función para formatear números a moneda COP
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

const EditarCompra: React.FC<EditarCompraProps> = ({
  isOpen,
  onClose,
  purchase,
  onUpdate,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [customerId, setCustomerId] = useState<number>(purchase.customerId);
  const [status, setStatus] = useState<string>(purchase.status);
  const [purchaseName, setPurchaseName] = useState<string>(purchase.name);
  const [products, setProducts] = useState<Producto[]>(
    purchase.products.map((product: any) => ({
      product_id: product.id,
      name: product.name,
      quantity: product.quantity,
      price: formatCurrency(product.price),
    }))
  );

  useEffect(() => {
    if (purchase) {
      // Datos básicos de la compra
      setCustomerId(purchase.customerId || purchase.customer_id);
      setStatus(purchase.status || 'pendiente');
      setPurchaseName(purchase.name || '');

      // Fechas
      const formattedPayDay = purchase.payday ? new Date(purchase.payday).toISOString().split('T')[0] : '';
      const formattedOrderDay = purchase.orderdate ? new Date(purchase.orderdate).toISOString().split('T')[0] : '';
      
      setpayDay(formattedPayDay);
      setorderDay(formattedOrderDay);

      // Productos
      if (purchase.products && Array.isArray(purchase.products)) {
        setProducts(
          purchase.products.map((product: any) => ({
            product_id: product.id,
            name: product.name || '',
            quantity: product.quantity || 0,
            price: formatCurrency(product.price || 0),
          }))
        );
      }

      // Cargar la lista de clientes
      fetchClientes();
    }
  }, [purchase]);

  // Función para cargar clientes
  const fetchClientes = async () => {
    try {
      const response = await fetch(createApiUrl('/clientes'));
      const data: Cliente[] = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const [payDay, setpayDay] = useState<string>(purchase.payDay || "");
  const [orderDay, setorderDay] = useState<string>(purchase.orderDay || "");

  const handleProductChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newProducts = [...products];
    if (field === "price") {
      const numericValue = Number(String(value).replace(/\D/g, ""));
      newProducts[index].price = numericValue ? formatCurrency(numericValue) : "";
    } else {
      newProducts[index] = { ...newProducts[index], [field]: value };
    }
    setProducts(newProducts);
  };

  const handlePriceFocus = (index: number) => {
    const newProducts = [...products];
    newProducts[index].price = newProducts[index].price.replace(/\D/g, "");
    setProducts(newProducts);
  };

  const handlePriceBlur = (index: number) => {
    const newProducts = [...products];
    const numericValue = Number(newProducts[index].price.replace(/\D/g, ""));
    newProducts[index].price = numericValue ? formatCurrency(numericValue) : "";
    setProducts(newProducts);
  };

  const handleAddProduct = () => {
    setProducts([
      ...products,
      { product_id: Date.now(), name: "", quantity: 0, price: "" },
    ]);
  };

  const handleRemoveProduct = (index: number,id:number) => {
    setProducts(products.filter((_, i) => i !== index));
    eliminarProducto(id);
  };

  const handleSubmit = async () => {
    try {
      const cleanedProducts = products.map((product) => ({
        ...product,
        price: Number(product.price.replace(/\D/g, "")),
      }));

      console.log(payDay + " " + orderDay 
      );

      const response = await fetch(
        createApiUrl('/compras', purchase.id.toString()),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            status,
            purchaseName: purchaseName,
            payDay: payDay,
            orderDay: orderDay,
            productos: cleanedProducts,
          }),
        }
      );

      if (response.ok) {
        const updatedPurchase = await response.json();
        onUpdate(updatedPurchase);
        onClose();
      } else {
        console.error("Error actualizando compra:", response.statusText);
      }
      window.location.reload();
    } catch (error) {
      console.error("Error actualizando compra:", error);
    }
  };

  const eliminarProducto = async (id:number) => {
    await fetch(createApiUrl('/compras/producto', id.toString()), {
      method: "DELETE",
      headers  : { "Content-Type": "application/json" },
    });
  }

  return (
    <Modal backdrop="blur" isOpen={isOpen} onClose={onClose} className="mt-22 ">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
                <h2 className="text-xl font-medium text-gray-800">Editar Compra</h2>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <Package size={18} />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Nombre de la Compra</label>
                    <input
                      type="text"
                      value={purchaseName}
                      onChange={(e) => setPurchaseName(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Ingrese el nombre de la compra"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-600">
                  <User size={18} />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Cliente</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Seleccionar Cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-600">
                  <ShoppingBag size={18} />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1 flex gap-3">
                      <button
                        onClick={() => setStatus('pagado')}
                        className={`flex-1 px-4 py-2.5 rounded-xl border transition-colors ${
                          status === 'pagado'
                            ? 'bg-green-50 border-green-200 text-green-600'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        Pagado
                      </button>
                      <button
                        onClick={() => setStatus('pendiente')}
                        className={`flex-1 px-4 py-2.5 rounded-xl border transition-colors ${
                          status === 'pendiente'
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        Pendiente
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={18} />
                      <label className="text-sm font-medium text-gray-700">Fecha de Pago</label>
                    </div>
                    <input
                      type="date"
                      value={payDay}
                      onChange={(e) => setpayDay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar size={18} />
                      <label className="text-sm font-medium text-gray-700">Fecha de Pedido</label>
                    </div>
                    <input
                      type="date"
                      value={orderDay}
                      onChange={(e) => setorderDay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">Productos</h3>
                  <Button
                    color="primary"
                    onPress={handleAddProduct}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl
                             transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Agregar Producto
                  </Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {products.map((product, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50
                               hover:border-gray-200 transition-all"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-700">Producto {index + 1}</h4>
                        <button
                          onClick={() => handleRemoveProduct(index, product.product_id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">Nombre</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(index, "name", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Nombre del producto"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">Cantidad</label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">Precio</label>
                          <input
                            type="text"
                            value={product.price}
                            onChange={(e) => handleProductChange(index, "price", e.target.value)}
                            onFocus={() => handlePriceFocus(index)}
                            onBlur={() => handlePriceBlur(index)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  Guardar Cambios
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default EditarCompra;