# Wox Todo Plugin

面向 Wox 的本地待办事项管理插件。所有任务数据只保存在本机，不需要账户或网络服务。

## 功能

- 输入 `todo <任务内容>` 快速新增待办事项。
- 输入 `todo <关键词>` 搜索已有任务。
- 在结果中标记完成、删除或编辑任务。
- 待完成与已完成任务分组展示；已完成任务可按设置自动清理。
- 操作后可保持 Wox 窗口显示，便于连续处理任务。

## 安装

需要 Wox `2.0.4` 或更高版本。

### 从 Wox Store 安装

当插件条目已合并到 Wox Store 后，执行：

```sh
wpm install Todo
```

### 从 GitHub Release 安装

在 [Releases](https://github.com/Flartiny/Wox.Plugin.Todo/releases) 下载 `wox.plugin.Todo.wox`，然后通过 Wox 插件管理器执行本地安装。

## 使用

| 输入          | 行为                 |
| ------------- | -------------------- |
| `todo 买牛奶` | 新增“买牛奶”任务     |
| `todo`        | 查看全部任务         |
| `todo 牛奶`   | 搜索包含“牛奶”的任务 |

## 设置

- **已完成任务过期天数**：默认 30 天；设为 `0` 表示永不自动清理，最大值为 365。
- **操作后保持窗口显示**：默认开启。开启后新增、完成、删除或编辑任务不会隐藏 Wox，方便连续操作。

## 开发与发布

```sh
make install  # 安装依赖
make test     # 运行测试
make lint     # 运行静态检查
make package  # 生成 wox.plugin.Todo.wox
```

发布 tag（例如 `v1.0.1`）会触发 GitHub Actions：测试、打包，并将 `wox.plugin.Todo.wox` 附加到 GitHub Release。Wox Store 条目应使用该 asset 的 `releases/latest/download/wox.plugin.Todo.wox` 地址。

## 许可证

[MIT License](LICENSE)
