import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Modal } from "@heroui/modal";
import { Input } from "@heroui/input";
import { createApiUrl } from "@/config/api";

interface Cliente {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

const SeleccionarCliente: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [clienteInfo, setClienteInfo] = useState<Cliente | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(createApiUrl('/clientes'));
        const data: Cliente[] = await response.json();
        setClientes(data);
        setFilteredClientes(data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    };
    fetchClientes();
  }, []);

  useEffect(() => {
    setFilteredClientes(
      clientes.filter(cliente =>
        cliente.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, clientes]);

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedId(cliente.id);
    setSearchTerm(cliente.name);
    setFilteredClientes([]);
  };

  const fetchClienteInfo = async () => {
    if (selectedId === null) return;
    try {
      const response = await fetch(
        createApiUrl('/clientes', selectedId.toString())
      );
      const data: Cliente = await response.json();
      setClienteInfo(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Error al obtener información del cliente:", error);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <Input
        placeholder="Buscar cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full max-w-md px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {searchTerm && filteredClientes.length > 0 && (
        <div className="w-full max-w-md bg-white border rounded-md shadow-lg">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              onClick={() => handleSelectCliente(cliente)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {cliente.name}
            </div>
          ))}
        </div>
      )}
      <Button
        onPress={fetchClienteInfo}
        isDisabled={!selectedId}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition mt-4"
      >
        Ver Cliente
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Card className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Detalles del Cliente</h2>
            <Button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 transition">
              &times;
            </Button>
          </div>
          {clienteInfo && (
            <div>
              <p>
                <strong>Nombre:</strong> {clienteInfo.name}
              </p>
              <p>
                <strong>Teléfono:</strong> {clienteInfo.phone}
              </p>
              <p>
                <strong>Fecha de Creación:</strong> {new Date(clienteInfo.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </Card>
      </Modal>
    </div>
  );
};

export default SeleccionarCliente;