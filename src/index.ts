import { Context, Plugin, PluginInitParams, PublicAPI, Query, Result } from "@wox-launcher/wox-plugin"
import { addTodo, deleteTodo, searchTodos, toggleTodo } from "./storage"
import { TodoItem } from "./types"

let api: PublicAPI

export const plugin: Plugin = {
  init: async (ctx: Context, initParams: PluginInitParams) => {
    api = initParams.API
    await api.Log(ctx, "Info", "Todo plugin initialized")
  },

  query: async (ctx: Context, query: Query): Promise<Result[]> => {
    const search = query.Search.trim()

    // 如果有输入且不为空，直接提供新增选项
    if (search) {
      const todos = searchTodos(search)
      const results: Result[] = []

      // 添加新增任务的选项
      results.push({
        Title: `新增任务: ${search}`,
        SubTitle: "按回车添加到待办列表",
        Icon: {
          ImageType: "relative",
          ImageData: "images/app.svg"
        },
        Preview: {
          PreviewType: "text",
          PreviewData: `将创建新任务: ${search}`,
          PreviewProperties: {}
        },
        Actions: [
          {
            Name: "添加任务",
            Action: async (actionCtx: Context) => {
              addTodo(search)
              await api.Notify(actionCtx, `已添加任务: ${search}`)
              await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
            }
          }
        ]
      })

      // 如果有匹配的任务，也显示出来
      if (todos.length > 0) {
        results.push(...convertTodosToResults(todos))
      }

      return results
    }

    // 空查询，列出所有任务
    const allTodos = searchTodos("")
    if (allTodos.length === 0) {
      return [
        {
          Title: "暂无待办事项",
          SubTitle: "输入 'todo 任务内容' 来添加新任务",
          Icon: {
            ImageType: "relative",
            ImageData: "images/app.svg"
          }
        }
      ]
    }

    // 分类：待完成在前，已完成在后
    const pending = allTodos.filter(t => !t.completed)
    const completed = allTodos.filter(t => t.completed)
    const sorted = [...pending, ...completed]

    return convertTodosToResults(sorted)
  }
}

function convertTodosToResults(todos: TodoItem[]): Result[] {
  return todos.map(todo => {
    const actions = []

    if (!todo.completed) {
      // 待完成任务：标记为完成
      actions.push({
        Name: "标记为完成",
        Action: async (actionCtx: Context) => {
          toggleTodo(todo.id)
          await api.Notify(actionCtx, `已完成: ${todo.text}`)
          await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
        }
      })
    }

    // 删除操作
    actions.push({
      Name: "删除",
      Action: async (actionCtx: Context) => {
        deleteTodo(todo.id)
        await api.Notify(actionCtx, `已删除: ${todo.text}`)
        await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
      }
    })

    return {
      Title: todo.completed ? `✓ ${todo.text}` : todo.text,
      SubTitle: todo.completed ? "已完成" : "待完成",
      Icon: {
        ImageType: "relative",
        ImageData: "images/app.svg"
      },
      Preview: {
        PreviewType: "text",
        PreviewData: `状态: ${todo.completed ? "已完成" : "待完成"}\n创建时间: ${new Date(todo.createdAt).toLocaleString()}`,
        PreviewProperties: {}
      },
      Actions: actions
    }
  })
}
