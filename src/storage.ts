import * as fs from "fs"
import * as path from "path"
import { TodoItem } from "./types"

function getWoxDataDir(): string {
  const appData = process.env.APPDATA
  if (process.platform === "win32" && appData) {
    return path.join(appData, "Wox", "Data")
  }

  const home = process.env.HOME || process.env.USERPROFILE || "~"
  return path.join(home, ".wox", "data")
}

const DATA_DIR = getWoxDataDir()
const TODO_FILE = path.join(DATA_DIR, "todo.json")
const TODO_FILE_TMP = `${TODO_FILE}.tmp`

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function loadTodos(): TodoItem[] {
  ensureDataDir()
  if (!fs.existsSync(TODO_FILE)) {
    return []
  }
  try {
    const content = fs.readFileSync(TODO_FILE, "utf-8")
    const parsed: unknown = JSON.parse(content)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isTodoItem)
  } catch {
    return []
  }
}

export function saveTodos(todos: TodoItem[]): void {
  ensureDataDir()
  fs.writeFileSync(TODO_FILE_TMP, JSON.stringify(todos, null, 2), "utf-8")
  fs.renameSync(TODO_FILE_TMP, TODO_FILE)
}

export function addTodo(text: string): TodoItem {
  const todos = loadTodos()
  const normalizedText = normalizeTodoText(text)
  const newTodo: TodoItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: normalizedText,
    completed: false,
    createdAt: Date.now()
  }
  todos.push(newTodo)
  saveTodos(todos)
  return newTodo
}

export function deleteTodo(id: string): void {
  const todos = loadTodos()
  const filtered = todos.filter(t => t.id !== id)
  saveTodos(filtered)
}

export function toggleTodo(id: string): void {
  const todos = loadTodos()
  const todo = todos.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
    saveTodos(todos)
  }
}

export function searchTodos(keyword: string): TodoItem[] {
  const todos = loadTodos()
  if (!keyword.trim()) {
    return todos
  }
  const lowerKeyword = keyword.toLowerCase()
  return todos.filter(t => t.text.toLowerCase().includes(lowerKeyword))
}

export function findTodoByText(text: string): TodoItem | undefined {
  const normalizedText = normalizeTodoText(text).toLowerCase()
  return loadTodos().find(todo => todo.text.toLowerCase() === normalizedText)
}

export function normalizeTodoText(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

function isTodoItem(value: unknown): value is TodoItem {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const todo = value as Partial<TodoItem>
  return typeof todo.id === "string" && typeof todo.text === "string" && typeof todo.completed === "boolean" && typeof todo.createdAt === "number"
}
