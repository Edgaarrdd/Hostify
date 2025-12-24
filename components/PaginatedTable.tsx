"use client";

import { useState, ReactNode, useEffect } from "react";

interface PaginatedTableProps<T> {
  data: T[];
  columns: {
    key: string;
    label: string | ReactNode;
    render?: (value: T[keyof T], row: T) => ReactNode;
    sortable?: boolean; // Nueva prop para habilitar sorting en columna
  }[];
  itemsPerPage?: number;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
  onPageChange?: (page: number) => void;
  customRender?: (paginatedData: T[]) => ReactNode; // Nuevo: renderizado personalizado
}

/**
 * Componente de tabla genérica con soporte para paginación automática.
 * 
 * @param data - Array de datos a mostrar.
 * @param columns - Configuración de columnas (clave, etiqueta y renderizado personalizado).
 * @param itemsPerPage - Número de elementos por página (default: 10).
 * @param emptyMessage - Mensaje a mostrar cuando no hay datos.
 */
export function PaginatedTable<T extends { id?: string | number }>({
  data,
  columns,
  itemsPerPage = 10,
  emptyMessage = "No hay datos para mostrar",
  rowClassName,
  onPageChange,
  customRender,
}: PaginatedTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Volver a la página 1 cuando cambian los datos (ej: filtros aplicados)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Tercer click: limpiar sort
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Ordenar datos antes de paginar
  const sortedData = sortKey
    ? [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    })
    : data;

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();

  return (
    <div className="space-y-4">
      {customRender ? (
        // Renderizado personalizado (e.g., grid de habitaciones)
        sortedData.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{emptyMessage}</p>
        ) : (
          customRender(paginatedData)
        )
      ) : (
        // Renderizado de tabla estándar
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="table-header">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`table-header-cell ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none' : ''}`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && (
                          <span className="text-xs text-muted-foreground">
                            {sortKey === column.key
                              ? sortDirection === 'asc' ? '↑' : '↓'
                              : '⇅'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id || idx} className={rowClassName ? rowClassName(row) : "table-row"}>
                      {columns.map((column) => (
                        <td
                          key={`${row.id || idx}-${column.key}`}
                          className="table-cell"
                        >
                          {column.render
                            ? column.render((row as unknown as Record<string, unknown>)[column.key] as T[keyof T], row)
                            : ((row as unknown as Record<string, unknown>)[column.key] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedData.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => {
              const next = Math.max(1, currentPage - 1);
              setCurrentPage(next);
              onPageChange?.(next);
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            ←
          </button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => {
              const next = Math.min(totalPages, currentPage + 1);
              setCurrentPage(next);
              onPageChange?.(next);
            }}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
