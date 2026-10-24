import React, { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { Modal } from "@heroui/modal";

import { createApiUrl } from "@/config/api";

interface Cliente {
  name: string;
  phone: string;
}

const AgregarCliente: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const savingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setMensaje("");
    setIsSaving(true);

    try {
      const response = await fetch(createApiUrl("/clientes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: name,
          telefono: phone,
          cedula: "",
          direccion: "",
          email: "",
        }),
      });

      const data: Cliente | { error: string } = await response.json();

      if (response.ok) {
        setMensaje("Cliente agregado con éxito");
        setName("");
        setPhone("");
        setTimeout(() => setIsOpen(false), 1000);
      } else {
        setMensaje(
          (data as { error: string }).error || "Error al agregar cliente",
        );
      }
    } catch {
      setMensaje("Error en la solicitud");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      {!isOpen && (
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
          onClick={() => setIsOpen(true)}
        >
          + Agregar Cliente
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Card className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Agregar Cliente</h2>
            <Button
              className="text-white hover:text-white transition"
              color="danger"
              onClick={() => setIsOpen(false)}
            >
              &times;
            </Button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md shadow-lg hover:bg-green-600 transition disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </form>
          {mensaje && (
            <p className="mt-4 text-sm text-gray-600 text-center">{mensaje}</p>
          )}
        </Card>
      </Modal>
    </div>
  );
};

export default AgregarCliente;
