import { registerAuthHandlers } from './auth'
import { registerUserHandlers } from './users'
import { registerMedicineHandlers } from './medicines'
import { registerCustomerHandlers } from './customers'
import { registerSupplierHandlers } from './suppliers'
import { registerSaleHandlers } from './sales'
import { registerPurchaseHandlers } from './purchases'
import { registerReportHandlers } from './reports'

export function registerIpcHandlers(): void {
  registerAuthHandlers()
  registerUserHandlers()
  registerMedicineHandlers()
  registerCustomerHandlers()
  registerSupplierHandlers()
  registerSaleHandlers()
  registerPurchaseHandlers()
  registerReportHandlers()
}
