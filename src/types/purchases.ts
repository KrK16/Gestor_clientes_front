export interface Product {
  id: number;
  name: string;
  purchaseId: number;
  quantity: number;
  price: number;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Purchase {
  id: number;
  price: number;
  customerId: number;
  status: string;
  orderdate: Date;
  payday: Date;
  debt: number;
  createdAt: string;
  name: string;
  products: Product[];
  customer: Customer;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  purchaseId: number;
  amount: number;
  date: string;
  createdAt: string;
}

export interface CustomerWithPurchases {
  customer: Customer;
  purchases: Purchase[];
}

export interface FilterOptions {
  searchTerm: string;
  selectedPurchaseName: string;
  selectedStatus: string;
  selectedOrderdate: Date | null;
}

export interface PurchaseActions {
  handleViewDetails: (purchase: Purchase) => void;
  handleDeletePurchase: (id: number) => void;
  handleAddPurchase: (newPurchase: Purchase) => void;
  handleUpdatePurchase: (updatedPurchase: Purchase) => void;
  openAbonoModal: (purchaseId: number) => void;
  setSelectedPurchaseId: (id: number | null) => void;
  setIsAbonosModalOpen: (open: boolean) => void;
  setPurchaseToEdit: (purchase: Purchase | null) => void;
  setIsEditModalOpen: (open: boolean) => void;
  setPurchaseToDelete: (id: number | null) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
}