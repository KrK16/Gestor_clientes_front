import React from "react";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import {Button} from "@heroui/button";

interface EliminarCompraProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number;
  onDelete: (id: number) => void;
}

const EliminarCompra: React.FC<EliminarCompraProps> = ({ isOpen, onClose, purchaseId, onDelete }) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://26.241.225.40:3000/compras/${purchaseId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(purchaseId);
        onClose();
      } else {
        console.error("Error deleting purchase:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Eliminar Compra</ModalHeader>
        <ModalBody>
          <p>¿Estás seguro de que deseas eliminar esta compra?</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="danger" onPress={handleDelete}>
            Eliminar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EliminarCompra;