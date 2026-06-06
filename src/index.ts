import {
  ActionContext,
  Context,
  FormActionContext,
  Plugin,
  PluginInitParams,
  PluginSettingDefinitionItem,
  PluginSettingValueTextBox,
  PublicAPI,
  Query,
  QueryResponse,
  Result,
  ResultAction
} from "@wox-launcher/wox-plugin"
import { addTodo, deleteTodo, findTodoByText, normalizeTodoText, searchTodos, toggleTodo, updateTodoText } from "./storage"
import { TodoItem } from "./types"

let api: PublicAPI
const ICON = {
  ImageType: "relative" as const,
  ImageData: "images/logo.png"
}
const EDIT_TEXT_KEY = "text"

export const plugin: Plugin = {
  init: async (ctx: Context, initParams: PluginInitParams) => {
    api = initParams.API
    await api.Log(ctx, "Info", "Todo plugin initialized")
  },

  query: async (ctx: Context, query: Query): Promise<QueryResponse> => {
    const search = normalizeTodoText(query.Search)

    // 如果有输入且不为空，直接提供新增选项
    if (search) {
      const todos = sortTodos(searchTodos(search))
      const results: Result[] = []
      const existingTodo = findTodoByText(search)

      // 添加新增任务的选项
      results.push({
        Id: `todo-add-${search}`,
        Title: existingTodo ? `已存在: ${search}` : `新增任务: ${search}`,
        SubTitle: existingTodo ? "按回车查看已有任务，不重复添加" : "按回车添加到待办列表",
        Icon: ICON,
        Preview: {
          PreviewType: "text",
          PreviewData: existingTodo ? `已存在任务: ${existingTodo.text}` : `将创建新任务: ${search}`,
          PreviewProperties: {}
        },
        Score: existingTodo ? 80 : 100,
        Actions: [
          {
            Name: existingTodo ? "刷新列表" : "添加任务",
            IsDefault: true,
            Action: async (actionCtx: Context, actionContext: ActionContext) => {
              void actionContext
              if (existingTodo) {
                await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
                return
              }

              const todo = addTodo(search)
              await api.Notify(actionCtx, `已添加任务: ${todo.text}`)
              await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
            }
          }
        ]
      })

      // 如果有匹配的任务，也显示出来
      if (todos.length > 0) {
        results.push(...convertTodosToResults(todos))
      }

      return { Results: results }
    }

    // 空查询，列出所有任务
    const allTodos = searchTodos("")
    if (allTodos.length === 0) {
      return {
        Results: [
          {
            Id: "todo-empty",
            Title: "暂无待办事项",
            SubTitle: "输入 'todo 任务内容' 来添加新任务",
            Icon: ICON,
            Score: 100
          }
        ]
      }
    }

    return { Results: convertTodosToResults(sortTodos(allTodos)) }
  }
}

function sortTodos(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1
    }

    return right.createdAt - left.createdAt
  })
}

function convertTodosToResults(todos: TodoItem[]): Result[] {
  return todos.map((todo, index) => {
    const actions: ResultAction[] = []

    if (!todo.completed) {
      // 待完成任务：标记为完成
      actions.push({
        Name: "标记为完成",
        IsDefault: true,
        Action: async (actionCtx: Context, actionContext: ActionContext) => {
          void actionContext
          toggleTodo(todo.id)
          await api.Notify(actionCtx, `已完成: ${todo.text}`)
          await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
        }
      })
    }

    actions.push({
      Type: "form",
      Name: "修改",
      Hotkey: "Ctrl+E",
      Form: createEditForm(todo),
      OnSubmit: async (actionCtx: Context, formContext: FormActionContext) => {
        const nextText = normalizeTodoText(formContext.Values[EDIT_TEXT_KEY] ?? "")
        if (!nextText) {
          await api.Notify(actionCtx, "任务内容不能为空")
          return
        }

        const existingTodo = findTodoByText(nextText)
        if (existingTodo && existingTodo.id !== todo.id) {
          await api.Notify(actionCtx, `已存在相同任务: ${nextText}`)
          return
        }

        const updatedTodo = updateTodoText(todo.id, nextText)
        if (!updatedTodo) {
          await api.Notify(actionCtx, "任务不存在，可能已被删除")
          await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
          return
        }

        await api.Notify(actionCtx, `已修改: ${updatedTodo.text}`)
        await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
      }
    })

    // 删除操作
    actions.push({
      Name: "删除",
      IsDefault: todo.completed,
      Action: async (actionCtx: Context, actionContext: ActionContext) => {
        void actionContext
        deleteTodo(todo.id)
        await api.Notify(actionCtx, `已删除: ${todo.text}`)
        await api.ChangeQuery(actionCtx, { QueryType: "input", QueryText: "todo " })
      }
    })

    const createdAtText = formatCreatedAt(todo.createdAt)

    return {
      Id: `todo-${todo.id}`,
      Title: todo.completed ? `✓ ${todo.text}` : todo.text,
      SubTitle: `创建于 ${createdAtText}`,
      Icon: ICON,
      Score: todo.completed ? 50 - index : 90 - index,
      Group: todo.completed ? "已完成" : "待完成",
      GroupScore: todo.completed ? 10 : 20,
      Tails: [
        {
          Type: "text",
          Text: todo.completed ? "已完成" : "待完成",
          TextCategory: todo.completed ? "success" : "warning"
        }
      ],
      Preview: {
        PreviewType: "text",
        PreviewData: `内容:\n${todo.text}\n\n状态: ${todo.completed ? "已完成" : "待完成"}\n创建时间: ${new Date(todo.createdAt).toLocaleString()}`,
        PreviewProperties: {}
      },
      Actions: actions
    }
  })
}

function formatCreatedAt(createdAt: number): string {
  return new Date(createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function createEditForm(todo: TodoItem): PluginSettingDefinitionItem[] {
  return [
    {
      Type: "textbox",
      Value: {
        Key: EDIT_TEXT_KEY,
        Label: "任务内容",
        Suffix: "",
        DefaultValue: todo.text,
        Tooltip: "修改待办事项内容",
        MaxLines: 3,
        Validators: [
          {
            Type: "not_empty",
            Value: {}
          }
        ]
      } as PluginSettingValueTextBox,
      DisabledInPlatforms: [],
      IsPlatformSpecific: false
    }
  ]
}
