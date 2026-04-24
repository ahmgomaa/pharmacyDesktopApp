export type UserRole = 'admin' | 'cashier'

export interface User {
  id: number
  username: string
  fullName: string
  role: UserRole
  active: number
  createdAt: string
}

export interface AuthenticatedUser extends User {
  token: string
}

export interface Medicine {
  id: number
  name: string
  barcode: string | null
  stock: number
  reorderLevel: number
  expiryDate: string | null
  price: number
  costPrice: number
  supplierId: number | null
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: string
}

export interface Supplier {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
}

export interface PurchaseOrder {
  id: number
  supplierId: number
  supplierName: string
  total: number
  notes: string | null
  createdAt: string
  itemCount: number
}

export interface PurchaseOrderItem {
  medicineId: number
  medicineName: string
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderItem[]
}

export interface SaleItem {
  medicineId: number
  medicineName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Sale {
  id: number
  customerId: number | null
  customerName: string | null
  userId: number
  userName: string
  total: number
  discount: number
  paid: number
  createdAt: string
  itemCount: number
}

export interface SaleDetail extends Sale {
  items: SaleItem[]
}

export interface IpcResult<T> {
  ok: boolean
  data?: T
  error?: string
}

export interface CreateMedicineInput {
  name: string
  barcode?: string | null
  stock: number
  reorderLevel: number
  expiryDate?: string | null
  price: number
  costPrice: number
  supplierId?: number | null
}

export interface CreateCustomerInput {
  name: string
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface CreateSupplierInput {
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export interface CreateUserInput {
  username: string
  fullName: string
  password: string
  role: UserRole
  active?: boolean
}

export interface UpdateUserInput {
  id: number
  fullName?: string
  password?: string
  role?: UserRole
  active?: boolean
}

export interface CartItem {
  medicineId: number
  medicineName: string
  unitPrice: number
  quantity: number
  availableStock: number
}

export interface CreateSaleInput {
  customerId: number | null
  discount: number
  paid: number
  items: Array<{ medicineId: number; quantity: number; unitPrice: number }>
}

export interface CreatePurchaseOrderInput {
  supplierId: number
  notes?: string | null
  items: Array<{ medicineId: number; quantity: number; unitCost: number }>
}

export interface DailySalesReportRow {
  date: string
  salesCount: number
  total: number
}

export interface LowStockRow {
  id: number
  name: string
  stock: number
  reorderLevel: number
}

export interface ExpiringSoonRow {
  id: number
  name: string
  expiryDate: string
  stock: number
  daysUntilExpiry: number
}

export interface DashboardStats {
  totalMedicines: number
  lowStockCount: number
  expiringSoonCount: number
  todaySalesCount: number
  todaySalesTotal: number
}
