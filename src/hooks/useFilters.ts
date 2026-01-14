import { useState, useEffect } from 'react';
import { Purchase, FilterOptions } from '@/types/purchases';

export const useFilters = (purchases: Purchase[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    selectedPurchaseName: '',
    selectedStatus: '',
    selectedOrderdate: null,
  });

  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>(purchases);

  useEffect(() => {
    const filtered = purchases.filter((purchase) => {
      // Validar que purchase y customer existan
      if (!purchase || !purchase.customer || !purchase.customer.name) {
        return false;
      }
      
      const matchesSearchTerm = purchase.customer.name.toLowerCase()
        .includes(filters.searchTerm.toLowerCase());
      
      const matchesPurchaseName = filters.selectedPurchaseName 
        ? purchase.name === filters.selectedPurchaseName 
        : true;
      
      const matchesStatus = filters.selectedStatus 
        ? purchase.status === filters.selectedStatus 
        : true;
      
      const matchesOrderdate = filters.selectedOrderdate 
        ? purchase.orderdate === filters.selectedOrderdate 
        : true;

      return matchesSearchTerm && matchesPurchaseName && matchesStatus && matchesOrderdate;
    });

    setFilteredPurchases(filtered);
  }, [purchases, filters]);

  const updateFilter = (key: keyof FilterOptions, value: string | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedPurchaseName: '',
      selectedStatus: '',
      selectedOrderdate: null,
    });
  };

  const getUniquePurchaseNames = () => {
    return Array.from(new Set(
      purchases
        .filter(purchase => purchase && purchase.name)
        .map(purchase => purchase.name)
    ));
  };

  const getUniqueStatuses = () => {
    return Array.from(new Set(
      purchases
        .filter(purchase => purchase && purchase.status)
        .map(purchase => purchase.status)
    ));
  };

  return {
    filters,
    filteredPurchases,
    updateFilter,
    clearFilters,
    getUniquePurchaseNames,
    getUniqueStatuses,
  };
};