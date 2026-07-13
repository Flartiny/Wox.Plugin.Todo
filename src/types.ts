export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
  completedAt?: number
}
