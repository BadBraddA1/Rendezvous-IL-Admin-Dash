import { neon } from "@neondatabase/serverless"

let sqlInstance: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!sqlInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

// Convenience named export so API routes can use: import { sql } from "@/lib/db"
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    const instance = getDb()
    const value = (instance as any)[prop]
    return typeof value === "function" ? value.bind(instance) : value
  },
  apply(_target, _thisArg, args) {
    return (getDb() as any)(...args)
  },
}) as ReturnType<typeof neon>
