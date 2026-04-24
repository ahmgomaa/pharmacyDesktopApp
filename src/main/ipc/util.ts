import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { IpcResult } from '@shared/types'

export function handle<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>
): void {
  ipcMain.handle(channel, async (event, ...rawArgs: unknown[]): Promise<IpcResult<TResult>> => {
    try {
      const result = await handler(event, ...(rawArgs as TArgs))
      return { ok: true, data: result }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message }
    }
  })
}
