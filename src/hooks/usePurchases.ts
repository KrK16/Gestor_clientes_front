import { useState, useEffect, useCallback } from 'react';
import { Purchase, CustomerWithPurchases } from '@/types/purchases';
import { purchasesAPI } from '@/services/purchasesAPI';

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentOperationCompleted, setPaymentOperationCompleted] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await purchasesAPI.getAllPurchases();
      setPurchases(data);
      setFilteredPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    if (paymentOperationCompleted) {
      fetchPurchases();
      setPaymentOperationCompleted(false);
    }
  }, [paymentOperationCompleted, fetchPurchases]);

  const handleDeletePurchase = useCallback((id: number) => {
    setPurchases(prev => prev.filter(purchase => purchase.id !== id));
    setFilteredPurchases(prev => prev.filter(purchase => purchase.id !== id));
  }, []);

  const handleAddPurchase = useCallback((newPurchase: Purchase) => {
    setPurchases(prev => [...prev, newPurchase]);
    setFilteredPurchases(prev => [...prev, newPurchase]);
  }, []);

  const handleUpdatePurchase = useCallback((updatedPurchase: Purchase) => {
    const updatePurchases = (purchases: Purchase[]) =>
      purchases.map(purchase => 
        purchase.id === updatedPurchase.id ? updatedPurchase : purchase
      );

    setPurchases(prev => updatePurchases(prev));
    setFilteredPurchases(prev => updatePurchases(prev));
  }, []);

  const handlePayAll = async (customerId: number) => {
    try {
      await purchasesAPI.payAllPurchases(customerId);
      await fetchPurchases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    }
  };

  const refreshPurchases = useCallback(() => {
    setPaymentOperationCompleted(true);
  }, []);

  const groupedPurchases = filteredPurchases.reduce((acc, purchase) => {
    // Validar que purchase y customer existan
    if (!purchase || !purchase.customer) {
      console.warn('Purchase sin customer válido:', purchase);
      return acc;
    }
    
    const customerId = purchase.customer.id;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: purchase.customer,
        purchases: [],
      };
    }
    acc[customerId].purchases.push(purchase);
    return acc;
  }, {} as Record<number, CustomerWithPurchases>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP' 
    }).format(value).replace(/,00$/, '');
  };

  const getCustomerPurchaseCount = (customerId: number) => {
    return purchases.filter(purchase => 
      purchase && purchase.customer && purchase.customer.id === customerId
    ).length;
  };

  const getCustomerTotalDebt = (customerId: number) => {
    return purchases
      .filter(purchase => 
        purchase && 
        purchase.customer && 
        purchase.customer.id === customerId && 
        purchase.status === "pendiente"
      )
      .reduce((sum, purchase) => sum + (purchase.debt || 0), 0);
  };

  return {
    purchases,
    filteredPurchases,
    setFilteredPurchases,
    loading,
    error,
    groupedPurchases,
    handleDeletePurchase,
    handleAddPurchase,
    handleUpdatePurchase,
    handlePayAll,
    refreshPurchases,
    formatCurrency,
    getCustomerPurchaseCount,
    getCustomerTotalDebt,
  };
};