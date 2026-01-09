import { Purchase, Payment } from '@/types/purchases';
import { createApiUrl } from '@/config/api';

export const purchasesAPI = {
  async getPurchaseWithPayments(purchaseId: number): Promise<Purchase> {
    const paymentsResponse = await fetch(createApiUrl('/abonos/abonocompra', purchaseId.toString()));
    
    if (!paymentsResponse.ok) {
      throw new Error(`Error al obtener abonos para la compra ${purchaseId}`);
    }
    
    const rawData = await paymentsResponse.json();
    
    // Convertir a array si es un objeto indexado
    const payments = Array.isArray(rawData) 
      ? rawData 
      : Object.values(rawData).filter(item => item && typeof item === 'object');
    
    // Necesitamos obtener el purchase original para combinarlo con los payments
    const purchaseResponse = await fetch(createApiUrl('/compras'));
    const allPurchases = await purchaseResponse.json();
    const purchaseData = Array.isArray(allPurchases) 
      ? allPurchases.find(p => p.id === purchaseId)
      : Object.values(allPurchases).find((p: any) => p && p.id === purchaseId);
    
    if (!purchaseData) {
      throw new Error(`No se encontró la compra ${purchaseId}`);
    }
    
    // Corregir el customer si viene como objeto indexado
    let customer = purchaseData.customer;
    if (customer && typeof customer === 'object' && !customer.id) {
      const customerData = Object.values(customer).find((val: any) => val && typeof val === 'object' && val.id);
      if (customerData) {
        customer = customerData;
      }
    }
    
    return { ...purchaseData, customer, payments } as Purchase;
  },

  async getAllPurchases(): Promise<Purchase[]> {
    const response = await fetch(createApiUrl('/compras'));
    
    if (!response.ok) {
      throw new Error('Error al obtener compras');
    }
    
    const rawData = await response.json();
    
    // Convertir objeto indexado a array
    const purchases: Purchase[] = Array.isArray(rawData) 
      ? rawData 
      : Object.values(rawData).filter(item => item && typeof item === 'object');
    
    // Validar y filtrar compras válidas
    const validPurchases = purchases.filter(purchase => {
      if (!purchase) {
        console.warn('Compra inválida (vacía):', purchase);
        return false;
      }
      
      // Si el customer está dentro de un objeto indexado, extraerlo
      if (purchase.customer && typeof purchase.customer === 'object' && !purchase.customer.id) {
        const customerData = Object.values(purchase.customer).find(val => val && typeof val === 'object' && val.id);
        if (customerData) {
          purchase.customer = customerData;
        }
      }
      
      if (!purchase.customer || !purchase.customer.id) {
        console.warn('Compra sin customer válido:', purchase);
        return false;
      }
      return true;
    });
    
    const purchasesWithPayments = await Promise.all(
      validPurchases.map(async (purchase) => {
        try {
          const purchaseWithPayments = await this.getPurchaseWithPayments(purchase.id);
          return purchaseWithPayments;
        } catch (error) {
          console.error(`Error al obtener abonos para la compra ${purchase.id}:`, error);
          return purchase;
        }
      })
    );
    
    return purchasesWithPayments;
  },

  async payAllPurchases(customerId: number): Promise<void> {
    const response = await fetch(createApiUrl('/abonos/abonoTotal', customerId.toString()), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Error al procesar el pago total');
    }
  },

  async getPurchasePayments(purchaseId: number): Promise<Payment[]> {
    const response = await fetch(createApiUrl('/abonos/abonocompra', purchaseId.toString()));
    
    if (!response.ok) {
      throw new Error(`Error al obtener abonos para la compra ${purchaseId}`);
    }
    
    return response.json();
  }
};