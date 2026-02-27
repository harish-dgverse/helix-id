import { promises as fs } from "fs"
import path from "path"

export async function readJsonFile<T>(relativePath: string, defaultValue: T): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), relativePath)
    const data = await fs.readFile(filePath, "utf8")
    return JSON.parse(data) as T
  } catch (err: any) {
    if (err && (err.code === "ENOENT" || err.code === "MODULE_NOT_FOUND")) {
      return defaultValue
    }
    console.error("Failed to read JSON file", relativePath, err)
    return defaultValue
  }
}

export async function writeJsonFile<T>(relativePath: string, data: T): Promise<void> {
  const filePath = path.join(process.cwd(), relativePath)
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
}

