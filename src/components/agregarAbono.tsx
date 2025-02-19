import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Plus, X } from "lucide-react";

interface AgregarAbonoProps {
  purchaseId: number;
  onAdd: (abono: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AgregarAbono: React.FC<AgregarAbonoProps> = ({ purchaseId, onAdd, isOpen, onClose }) => {
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (purchaseId && amount) {
      try {
        const response = await fetch("http://26.241.225.40:3000/abonos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ purchase_id: purchaseId, amount }),
        });
        const data = await response.json();
        onAdd(data);
        onClose();
      } catch (error) {
        console.error("Error al agregar abono:", error);
      }
    }
  };

  return (
    <>
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose} className="min-h-screen flex items-center justify-center">
        <ModalContent className="w-full max-w-lg mx-auto p-4">
          <ModalHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
              <h2 className="text-xl font-semibold text-gray-800">Agregar Nuevo Abono</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID de la Compra</label>
                <input
                  type="number"
                  value={purchaseId}
                  readOnly
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto del Abono</label>
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Agregar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AgregarAbono;