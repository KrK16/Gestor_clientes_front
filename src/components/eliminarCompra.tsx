import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";

import { createApiUrl } from "@/config/api";

interface EliminarCompraProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number;
  onDelete: (id: number) => void;
}

const EliminarCompra: React.FC<EliminarCompraProps> = ({
  isOpen,
  onClose,
  purchaseId,
  onDelete,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [nAbonos, setNAbonos] = useState<number | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      setNAbonos(null);

      return;
    }
    fetch(createApiUrl("/abonos", `abonocompra/${purchaseId}`))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNAbonos(Array.isArray(data) ? data.length : 0))
      .catch(() => setNAbonos(null));
  }, [isOpen, purchaseId]);

  const handleDelete = async () => {
    setError(null);
    try {
      const response = await fetch(
        createApiUrl("/compras", purchaseId.toString()),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onDelete(purchaseId);
        onClose();
      } else {
        const data = await response.json().catch(() => null);
        const msg =
          (data && (data.error || data.message)) ||
          "No se pudo eliminar la compra.";

        setError(
          typeof msg === "string" ? msg : "No se pudo eliminar la compra.",
        );
      }
    } catch {
      setError("Error de conexión al eliminar la compra.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Eliminar Compra</ModalHeader>
        <ModalBody>
          <p>¿Estás seguro de que deseas eliminar esta compra?</p>
          {nAbonos !== null && nAbonos > 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Esta compra tiene {nAbonos} abono(s) registrado(s). Si la deuda
              está en cero, se eliminarán junto con la compra.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
