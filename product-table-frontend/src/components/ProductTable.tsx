import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'

// Types
interface Product {
  id: number
  title: string
  price: number
  category: string
  brand: string
  stock: number
  rating: number
}

interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

// API Fetch Function
const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch('https://dummyjson.com/products?limit=100')
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  return response.json()
}

// Column Helper
const columnHelper = createColumnHelper<Product>()

const columns: ColumnDef<Product, any>[] = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: info => info.getValue(),
    size: 60,
  }),
  columnHelper.accessor('title', {
    header: 'Product Name',
    cell: info => info.getValue(),
    size: 250,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: info => (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        {info.getValue()}
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor('brand', {
    header: 'Brand',
    cell: info => info.getValue(),
    size: 120,
  }),
columnHelper.accessor('price', {
  header: 'Price',
  cell: info => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(info.getValue());
  },
  size: 120,
}),
  columnHelper.accessor('stock', {
    header: 'Stock',
    cell: info => {
      const stock = info.getValue()
      return (
        // If stock is less than 50, red text, else green
        <span className={`font-medium ${stock < 50 ? 'text-red-600' : 'text-green-600'}`}> 
          {stock}
        </span>
      )
    },
    size: 80,
  }),
  columnHelper.accessor('rating', {
    header: 'Rating',
    cell: info => (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">★</span>
        <span>{info.getValue().toFixed(1)}</span>
      </div>
    ),
    size: 100,
  }),
]

export default function ProductTable() {
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // TanStack Query - Data Fetching
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  })

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!data?.products) return []
    const uniqueCategories = Array.from(
      new Set(data.products.map(p => p.category))
    )
    return uniqueCategories.sort()
  }, [data])

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    if (categoryFilter === 'all') return data.products
    return data.products.filter(p => p.category === categoryFilter)
  }, [data, categoryFilter])

  // TanStack Table - Table with Pagination
  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700 font-medium">Loading products...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Error Loading Data</h2>
          <p className="text-gray-600 text-center mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Product Catalog</h1>
            <p className="text-blue-100">Browse our collection of {data?.total || 0} products</p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                      No products found matching your criteria
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 text-sm text-gray-800">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(table.getPageCount(), 10) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      table.getState().pagination.pageIndex === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}