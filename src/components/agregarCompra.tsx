import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Plus, Trash2, User, UserPlus } from "lucide-react";

import { createApiUrl } from "@/config/api";

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

const AgregarCompra: React.FC<AgregarCompraProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [products, setProducts] = useState<
    { name: string; quantity: string; price: string }[]
  >([{ name: "", quantity: "", price: "" }]);
  const [payday, setPayday] = useState<string>("");
  const [orderdate, setOrderdate] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(createApiUrl("/clientes"));
        const data: Cliente[] = await response.json();

        setClientes(data);
      } catch {}
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
  const handleAmountChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value) {
      // Actualizar el precio del producto específico (guardamos el valor numérico)
      handleProductChange(index, "price", value);
    }
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: "", quantity: "", price: "" }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newProducts = [...products];

    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleSubmit = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setSubmitError(null);
    try {
      // Calculate total price from products
      const totalPrice = products.reduce(
        (sum, p) => sum + Number(p.price) * Number(p.quantity || 1),
        0,
      );
      const productos = products
        .filter((p) => p.name)
        .map((p) => ({
          nombre: p.name,
          cantidad: Number(p.quantity) || 1,
          precio: Number(p.price) || 0,
        }));

      // Get the first product name as the "revista" name, or use the name field
      const revistaName = name || products[0]?.name || "Compra";

      const url = isNewClient
        ? createApiUrl("/compras/compraNCliente")
        : createApiUrl("/compras");

      const body = isNewClient
        ? {
            cliente: {
              nombre: customerName,
              cedula: "00000000", // Default cedula for new client via this flow
              telefono: customerPhone,
              direccion: "",
              email: "",
            },
            compra: {
              revista: revistaName,
              precio: totalPrice,
              productos,
              fechaCompra: orderdate
                ? new Date(orderdate).toISOString()
                : new Date().toISOString(),
              fechaVencimiento: payday
                ? new Date(payday).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }
        : {
            clienteId: customerId,
            revista: revistaName,
            precio: totalPrice,
            productos,
            fechaCompra: orderdate
              ? new Date(orderdate).toISOString()
              : new Date().toISOString(),
            fechaVencimiento: payday
              ? new Date(payday).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

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
      } else {
        setSubmitError("No se pudo crear la compra. Intente de nuevo.");
      }
    } catch {
      setSubmitError("Error de conexión al crear la compra.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      className="h-auto h-max-[90%vh]"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent className="my-8 max-h-[90vh]">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
                <h2 className="text-xl font-medium text-gray-800">
                  Agregar Compra
                </h2>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Client Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                        !isNewClient
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                      onClick={() => setIsNewClient(false)}
                    >
                      <User size={16} />
                      Cliente Existente
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                        isNewClient
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white text-gray-600 border border-gray-200"
                      }`}
                      onClick={() => setIsNewClient(true)}
                    >
                      <UserPlus size={16} />
                      Cliente Nuevo
                    </button>
                  </div>
                </div>

                {isNewClient ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-gray-700"
                        htmlFor="customer-name"
                      >
                        Nombre del Cliente
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                                 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 transition-all duration-200"
                        id="customer-name"
                        placeholder="Ingrese el nombre del cliente"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium text-gray-700"
                        htmlFor="customer-phone"
                      >
                        Teléfono
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                                 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 transition-all duration-200"
                        id="customer-phone"
                        placeholder="Ingrese el teléfono"
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="select-client"
                    >
                      Seleccionar Cliente
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                      id="select-client"
                      value={customerId ?? ""}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
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
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="payday"
                    >
                      Fecha de pago
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                      id="payday"
                      type="date"
                      value={payday}
                      onChange={(e) => setPayday(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="orderdate"
                    >
                      Fecha de compra
                    </label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                      id="orderdate"
                      type="date"
                      value={orderdate}
                      onChange={(e) => setOrderdate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Purchase Name Section */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="purchase-name"
                  >
                    Nombre de la Compra
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 
                             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                             transition-all duration-200"
                    id="purchase-name"
                    placeholder="Ingrese el nombre de la compra"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="sticky top-0 bg-white z-10 pb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">
                    Productos
                  </h3>
                  <Button
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl
                             transition-all duration-200 flex items-center gap-2 hover:scale-105"
                    color="primary"
                    onPress={handleAddProduct}
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
                            <span className="text-sm font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-700">
                            Producto {index + 1}
                          </h4>
                        </div>
                        <button
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 
                                   transition-colors group"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <Trash2
                            className="group-hover:scale-110 transition-transform"
                            size={18}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-gray-600"
                            htmlFor={`product-name-${index}`}
                          >
                            Nombre
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     transition-all duration-200"
                            id={`product-name-${index}`}
                            placeholder="Nombre del producto"
                            type="text"
                            value={product.name}
                            onChange={(e) =>
                              handleProductChange(index, "name", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-gray-600"
                            htmlFor={`product-quantity-${index}`}
                          >
                            Cantidad
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
                                     focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     transition-all duration-200"
                            id={`product-quantity-${index}`}
                            placeholder="0"
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-gray-600"
                            htmlFor={`product-price-${index}`}
                          >
                            Precio
                          </label>
                          <input
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 
             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
             transition-all duration-200"
                            id={`product-price-${index}`}
                            placeholder="$0"
                            type="text"
                            value={
                              product.price
                                ? formatCurrency(Number(product.price))
                                : ""
                            } // Mostrar el precio formateado
                            onChange={(e) => handleAmountChange(index, e)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-gray-100 p-6">
              <div className="w-full">
                {submitError && (
                  <p className="mb-3 text-sm text-red-600 text-right">
                    {submitError}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    className="px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                    variant="light"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white 
                           px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 
                           hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50"
                    color="primary"
                    disabled={isSaving}
                    onPress={handleSubmit}
                  >
                    {isSaving ? "Guardando..." : "Crear Compra"}
                  </Button>
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AgregarCompra;
