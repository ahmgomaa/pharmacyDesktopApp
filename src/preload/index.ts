import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/ipcChannels'
import type {
  AuthenticatedUser,
  CreateCustomerInput,
  CreateMedicineInput,
  CreatePurchaseOrderInput,
  CreateSaleInput,
  CreateSupplierInput,
  CreateUserInput,
  Customer,
  DailySalesReportRow,
  DashboardStats,
  ExpiringSoonRow,
  IpcResult,
  LowStockRow,
  Medicine,
  PurchaseOrder,
  PurchaseOrderDetail,
  Sale,
  SaleDetail,
  Supplier,
  UpdateUserInput,
  User
} from '@shared/types'

async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result: IpcResult<T> = await ipcRenderer.invoke(channel, ...args)
  if (!result.ok) {
    throw new Error(result.error || 'Unknown error')
  }
  return result.data as T
}

const api = {
  auth: {
    login: (username: string, password: string): Promise<AuthenticatedUser> =>
      call(IPC.auth.login, { username, password }),
    logout: (): Promise<true> => call(IPC.auth.logout),
    currentUser: (): Promise<AuthenticatedUser | null> => call(IPC.auth.currentUser)
  },
  users: {
    list: (): Promise<User[]> => call(IPC.users.list),
    create: (input: CreateUserInput): Promise<User> => call(IPC.users.create, input),
    update: (input: UpdateUserInput): Promise<User> => call(IPC.users.update, input),
    remove: (id: number): Promise<true> => call(IPC.users.remove, id)
  },
  medicines: {
    list: (): Promise<Medicine[]> => call(IPC.medicines.list),
    search: (query: string): Promise<Medicine[]> => call(IPC.medicines.search, query),
    get: (id: number): Promise<Medicine | null> => call(IPC.medicines.get, id),
    getByBarcode: (barcode: string): Promise<Medicine | null> =>
      call(IPC.medicines.getByBarcode, barcode),
    create: (input: CreateMedicineInput): Promise<Medicine> => call(IPC.medicines.create, input),
    update: (input: { id: number } & CreateMedicineInput): Promise<Medicine> =>
      call(IPC.medicines.update, input),
    remove: (id: number): Promise<true> => call(IPC.medicines.remove, id)
  },
  customers: {
    list: (): Promise<Customer[]> => call(IPC.customers.list),
    create: (input: CreateCustomerInput): Promise<Customer> => call(IPC.customers.create, input),
    update: (input: { id: number } & CreateCustomerInput): Promise<Customer> =>
      call(IPC.customers.update, input),
    remove: (id: number): Promise<true> => call(IPC.customers.remove, id)
  },
  suppliers: {
    list: (): Promise<Supplier[]> => call(IPC.suppliers.list),
    create: (input: CreateSupplierInput): Promise<Supplier> => call(IPC.suppliers.create, input),
    update: (input: { id: number } & CreateSupplierInput): Promise<Supplier> =>
      call(IPC.suppliers.update, input),
    remove: (id: number): Promise<true> => call(IPC.suppliers.remove, id)
  },
  sales: {
    list: (): Promise<Sale[]> => call(IPC.sales.list),
    get: (id: number): Promise<SaleDetail | null> => call(IPC.sales.get, id),
    create: (input: CreateSaleInput): Promise<SaleDetail> => call(IPC.sales.create, input)
  },
  purchases: {
    list: (): Promise<PurchaseOrder[]> => call(IPC.purchases.list),
    get: (id: number): Promise<PurchaseOrderDetail | null> => call(IPC.purchases.get, id),
    create: (input: CreatePurchaseOrderInput): Promise<PurchaseOrderDetail> =>
      call(IPC.purchases.create, input)
  },
  reports: {
    dailySales: (days?: number): Promise<DailySalesReportRow[]> =>
      call(IPC.reports.dailySales, { days }),
    lowStock: (): Promise<LowStockRow[]> => call(IPC.reports.lowStock),
    expiringSoon: (days?: number): Promise<ExpiringSoonRow[]> =>
      call(IPC.reports.expiringSoon, { days }),
    dashboardStats: (): Promise<DashboardStats> => call(IPC.reports.dashboardStats)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  const w = window as unknown as { electron: typeof electronAPI; api: typeof api }
  w.electron = electronAPI
  w.api = api
}

export type AppApi = typeof api
