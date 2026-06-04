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
    return JSON.parse(content)
  } catch {
    return []
  }
}

export function saveTodos(todos: TodoItem[]): void {
  ensureDataDir()
  fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2), "utf-8")
}

export function addTodo(text: string): TodoItem {
  const todos = loadTodos()
  const newTodo: TodoItem = {
    id: Date.now().toString(),
    text,
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
