import React from 'react';
import { Search, Package } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  selectedPurchaseName: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onPurchaseNameChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  uniquePurchaseNames: string[];
  uniqueStatuses: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  selectedPurchaseName,
  selectedStatus,
  onSearchChange,
  onPurchaseNameChange,
  onStatusChange,
  uniquePurchaseNames,
  uniqueStatuses,
}) => {
  return (
    <div className="mb-7 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="w-full">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Búsqueda</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-[0.5px] border-gray-200 rounded-lg focus:ring-focus:border-transparent"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar Compras</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedPurchaseName}
              onChange={(e) => onPurchaseNameChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las compras</option>
              {uniquePurchaseNames.map((name) => (
                <option key={name || 'unknown'} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {uniqueStatuses.map((status) => (
                <option key={status || 'unknown'} value={status}>
                  {status === 'pagado' ? 'Pagado' : status === 'pendiente' ? 'Pendiente' : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;