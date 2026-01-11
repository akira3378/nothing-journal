# Nothing Journal 项目基准

本文件是提供给后续开发工具和 AI 助手的项目状态说明，不是面向普通访客的产品介绍。后续修改应先阅读本文档，并在业务、数据结构或部署状态发生变化后同步更新。

## 1. 当前状态

- 产品：Nothing Journal
- 定位：公开浏览的个人旅行记录网站
- 本地目录：`/Users/akira/Documents/admin`
- GitHub：[akira3378/nothing-journal](https://github.com/akira3378/nothing-journal)
- 当前分支：`main`
- 默认语言：日语
- 支持语言：中文、日语、英语
- 公开访问：旅行记录列表、单条记录、照片、评论
- 登录后操作：发布、点赞、评论、回复、个人资料编辑
- 管理能力：基于数据库 `profiles.role` 的内容删除权限

## 2. 部署状态

- Vercel 项目：`nothing-journal`
- Vercel Project ID：`prj_nlt9qWSr4qj8i9o24r8hcGFwwDir`
- Team：`jxfine34s-projects`
- Framework：Vite
- 自动部署分支：GitHub `main`
- 生产地址：[https://admin-neon-rho.vercel.app](https://admin-neon-rho.vercel.app)
- 部署状态：已验证生产部署为 `READY`

## 3. 技术栈与运行方式

- React 19
- TypeScript
- Vite 6
- React Router 6
- Ant Design 5
- SWR
- `@supabase/supabase-js`
- `browser-image-compression`
- `country-state-city`
- Tailwind CSS CDN

```bash
npm install
npm run dev
npx tsc --noEmit
npm run build
```

开发服务器使用 `0.0.0.0:3000`。

## 4. 实际目录结构

```text
.
├── App.tsx                  # 应用入口、路由、认证初始化和全局状态
├── index.tsx                # React 挂载入口
├── types.ts                 # 用户、帖子、评论和站点配置类型
├── services/
│   └── supabaseBackend.ts   # Supabase 数据访问层
├── hooks/
│   └── useData.ts           # Feed、个人帖子和当前用户的 SWR hooks
├── pages/
│   ├── LandingPage.tsx      # 首页
│   ├── LoginPage.tsx        # 密码登录和邮箱验证码登录
│   ├── FeedPage.tsx         # 旅行记录列表、发布和互动
│   ├── ProfilePage.tsx      # 个人资料和个人记录
│   └── PostDetailPage.tsx   # 单条记录和评论树
├── components/
│   ├── Navbar.tsx           # 导航、语言、主题、通知
│   ├── UI.tsx               # 通用 UI、Toast 和交互组件
│   └── ImagePreview.tsx     # 图片预览
├── utils/
│   ├── i18n.ts              # 中文、日语、英语资源和语言状态
│   └── formatters.ts        # 时间和通知格式化
├── README.md                # 日语优先、英语补充的项目说明
├── CHANGELOG.md             # 按 commit 时间整理的变更记录
└── PROJECT_BASELINE.md      # 本文件
```

## 5. 页面与权限

| 路径 | 页面 | 访问规则 |
|---|---|---|
| `/` | 首页 | 公开 |
| `/login` | 登录 | 未登录用户 |
| `/journal` | 旅行记录列表 | 公开浏览；登录后可发布和互动 |
| `/post/:id` | 单条旅行记录 | 公开浏览 |
| `/profile` | 个人资料 | 登录后 |
| `/register` | 历史兼容路径 | 重定向到 `/login` |
| `/feed` | 历史兼容路径 | 重定向到 `/journal` |
| `/admin` | 历史兼容路径 | 重定向到 `/journal` |

当前不再有注册审核、会员续期、凭证上传、公告管理或独立审核后台。

## 6. 前端与 Supabase 的边界

```text
React 页面
  -> services/supabaseBackend.ts
  -> @supabase/supabase-js
  -> Supabase Auth / Postgres / Storage / Realtime
```

主要数据访问职责：

- Auth：会话、密码登录、邮箱验证码登录、登出
- Profiles：作者资料、头像、角色
- Posts：旅行记录、标题、日期、公开状态、图片
- Comments：评论、回复、删除
- Likes：点赞和取消点赞
- Notifications：评论、回复和新记录通知
- Storage：`avatars` 和 `posts` 两个 bucket
- Realtime：通知和新记录订阅

浏览器端只使用 Supabase publishable/anon key。该 key 属于公开客户端配置，实际数据权限必须由 RLS 保证；禁止把 `service_role` key、数据库密码或其他服务器秘密写入仓库或 `VITE_*` 变量。

## 7. 当前数据库模型

当前 public 表：

| 表 | 用途 |
|---|---|
| `profiles` | 用户资料和角色 |
| `posts` | 旅行记录和图片 |
| `comments` | 评论和嵌套回复 |
| `likes` | 帖子点赞，用户与帖子组合唯一 |
| `notifications` | 评论、回复和新记录通知 |
| `site_config` | Logo 等站点配置 |

`posts` 复用原有内容表，并使用以下旅行记录字段：

- `title`：记录标题
- `entry_date`：记录发生日期
- `is_published`：是否公开

`profiles.id` 与 `auth.users.id` 关联。帖子、评论、点赞和通知通过外键关联用户或帖子。当前没有正式 migration 目录，后续 schema 调整应补充可追踪的 migration。

## 8. 国际化约定

- 语言资源集中在 `utils/i18n.ts`。
- `LANGUAGE_OPTIONS` 是语言切换的唯一选项来源。
- 默认语言为日语，用户选择保存在 `localStorage` 的 `app_lang`。
- 新增 UI 文案必须同时补充中文、日语、英语资源。
- 页面、Toast、错误提示、placeholder、按钮、aria-label 和 Ant Design 文案都必须经过翻译资源。
- 不要在页面组件中直接写面向用户的自然语言文本；品牌名、URL、协议名和错误代码除外。

## 9. 已知技术风险

1. `services/supabaseBackend.ts` 是 Supabase 服务层，集中处理 Auth、数据库、Storage 和 Realtime 访问。
2. `getFeed()` 会为每条记录分别读取点赞数、评论数和当前用户点赞状态，数据量增长后需要优化 N+1 查询。
3. 数据库当前缺少正式 migration 管理，远程 schema 变更需要特别记录。
4. 前端拥有公开 Supabase key 是预期架构，但任何新表、新字段和新写入操作都必须同步检查 RLS。
5. Vite 构建仍会提示较大的 vendor bundle，当前不影响构建成功；后续可以通过更细的代码分割优化。

## 10. 后续修改规则

- 涉及 Auth、RLS、Storage 或数据库字段时，先确认远程 schema 和现有数据影响范围。
- 权限控制不能只依赖前端路由，必须同时依赖数据库 RLS。
- 不恢复已删除的注册审核、会员、凭证和公告流程，除非重新确认产品方向。
- 公开页面默认使用 `/journal` 和 `/post/:id`。
- 每次代码修改后至少运行 `npx tsc --noEmit` 和 `npm run build`。
- 更新 README、CHANGELOG 或本文件时，保持三者的产品名称、仓库地址和部署地址一致。
- 完成修改后提交并推送 `main`，让 Vercel 通过 Git 集成自动部署。

## 11. 参考文件

- [README.md](./README.md)：对外项目介绍，日语优先、英语补充
- [CHANGELOG.md](./CHANGELOG.md)：按实际 commit 时间整理的实现历史
- [package.json](./package.json)：依赖和脚本
- [services/supabaseBackend.ts](./services/supabaseBackend.ts)：Supabase 数据访问实现
- [utils/i18n.ts](./utils/i18n.ts)：三语言资源和语言切换实现
