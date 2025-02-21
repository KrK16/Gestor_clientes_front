import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";

interface AgregarAbonoProps {
  purchaseId: number;
  onAdd: (abono: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AgregarAbono: React.FC<AgregarAbonoProps> = ({ purchaseId, onAdd, isOpen, onClose }) => {
  const [amount, setAmount] = useState<number | null>(null);
  const [formattedAmount, setFormattedAmount] = useState<string>('');


  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters
    const value = e.target.value.replace(/\D/g, '');
    
    if (value) {
      const numberValue = Number(value);
      setAmount(numberValue);
      setFormattedAmount(formatCurrency(numberValue));
    } else {
      setAmount(null);
      setFormattedAmount('');
    }
  };
  useEffect(() => {
    if (isOpen) {
      setAmount(null);
      setFormattedAmount('');
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
          body: JSON.stringify({ 
            purchase_id: purchaseId, 
            amount,
      
          }),
        });
        const data = await response.json();
        onAdd(data);
        onClose();
      } catch (error) {
        console.error("Error al agregar abono:", error);
      }
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Modal backdrop="blur" isOpen={isOpen} onClose={onClose} className=" flex items-start w-auto ">
        <ModalContent className="w-auto max-w-lg mx-auto p-4 flex flex-col  bg-white rounded-lg shadow-lg">
  
        <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"/>
                <h2 className="text-xl font-medium text-gray-800">Añadir abono</h2>
              </div>
            </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
            <div>
  <label className="block text-sm font-medium text-gray-700">Monto del Abono</label>
  <input
    type="text"
    value={formattedAmount}
    onChange={handleAmountChange}
    placeholder="$0"
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