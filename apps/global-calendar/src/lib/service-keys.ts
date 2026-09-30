import { randomBytes, createHash } from 'crypto'
import { prisma } from './prisma'

export interface ServiceKeyData {
  id: number
  name: string
  moduleName: string
  permissions: any
  isActive: boolean
  lastUsed: Date | null
}

export function generateAPIKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = key.substring(0, 12)
  return { key, hash, prefix }
}

export async function validateServiceKey(key: string): Promise<ServiceKeyData | null> {
  const hash = createHash('sha256').update(key).digest('hex')
  
  const serviceKey = await prisma.serviceKey.findUnique({
    where: { keyHash: hash, isActive: true },
  })

  if (!serviceKey) return null

  // Update last used timestamp
  await prisma.serviceKey.update({
    where: { id: serviceKey.id },
    data: { lastUsed: new Date() },
  })

  return {
    id: serviceKey.id,
    name: serviceKey.name,
    moduleName: serviceKey.moduleName,
    permissions: serviceKey.permissions,
    isActive: serviceKey.isActive,
    lastUsed: serviceKey.lastUsed,
  }
}

export async function createServiceKey(
  name: string,
  moduleName: string,
  permissions: any,
  createdBy: number
): Promise<{ key: string; serviceKey: ServiceKeyData }> {
  const { key, hash, prefix } = generateAPIKey()

  const serviceKey = await prisma.serviceKey.create({
    data: {
      name,
      moduleName,
      keyHash: hash,
      keyPrefix: prefix,
      permissions,
      createdBy,
    },
  })

  return {
    key,
    serviceKey: {
      id: serviceKey.id,
      name: serviceKey.name,
      moduleName: serviceKey.moduleName,
      permissions: serviceKey.permissions,
      isActive: serviceKey.isActive,
      lastUsed: serviceKey.lastUsed,
    },
  }
}
