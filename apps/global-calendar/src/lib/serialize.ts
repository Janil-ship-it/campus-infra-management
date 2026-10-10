import { Prisma } from '@prisma/client'

export function safeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v))
  ) as Prisma.InputJsonValue
}
