import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card } from '@heroui/card';
import { Modal } from '@heroui/modal';
import { createApiUrl } from "@/config/api";

interface Cliente {
  name: string;
  phone: string;
}

const AgregarCliente: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [mensaje, setMensaje] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');

    try {
      const response = await fetch(createApiUrl('/clientes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });

      const data: Cliente | { error: string } = await response.json();
      if (response.ok) {
        setMensaje('Cliente agregado con éxito');
        setName('');
        setPhone('');
        setTimeout(() => setIsOpen(false), 1000);
      } else {
        setMensaje((data as { error: string }).error || 'Error al agregar cliente');
      }
    } catch (error) {
      setMensaje('Error en la solicitud');
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition">
          + Agregar Cliente
        </Button>
      )}
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Card className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Agregar Cliente</h2>
            <Button color = "danger" onClick={() => setIsOpen(false)} className="text-white hover:text-white transition">
              &times;
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button type="submit" className="w-full bg-green-500 text-white px-4 py-2 rounded-md shadow-lg hover:bg-green-600 transition">Guardar</Button>
          </form>
          {mensaje && <p className="mt-4 text-sm text-gray-600 text-center">{mensaje}</p>}
        </Card>
      </Modal>
    </div>
  );
};

export default AgregarCliente;