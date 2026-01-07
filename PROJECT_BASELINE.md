# NOTHING 项目基准文档

> 这是当前项目的工作基准。后续修改默认以本文档记录的代码、数据库和业务状态为起点。

- 基准日期：2026-07-11（Asia/Tokyo）
- 本地项目目录：`/Users/akira/Documents/admin`
- Git 远程仓库：`https://github.com/akira3378/admin.git`
- 当前分支：`main`
- 当前工作区：无未提交代码修改
- 当前产品名称：`NOTHING`
- 当前产品方向：公开旅行记录 / 个人旅行档案
- 当前交互基准：公开浏览，登录后写作和互动

## 1. 项目定位

这是一个可以公开浏览的个人旅行记录网站。访客可以阅读旅行记录、照片、地点和评论；登录用户可以发布、点赞、评论和回复；管理员保留内容和站点配置管理能力。

首页保留黑白、颗粒感的视觉风格，但聚焦于“浏览旅行记录 / 开始记录”两条主线；公告和首页视频模块已移除。界面支持中文、日文、英文和明暗主题，默认语言为日文。

当前项目是纯前端单页应用，Supabase 同时承担认证、数据库、文件存储和实时订阅功能。项目没有独立的后端服务目录，也没有自建 API Server。原来的会员/注册逻辑仍保留在代码中，但注册入口不再是主浏览路径。

## 2. 技术栈与运行方式

- React 19
- TypeScript
- Vite 6
- React Router 6
- Ant Design 5
- SWR
- `@supabase/supabase-js` 2.39.3
- `browser-image-compression`
- `country-state-city`
- Tailwind CSS CDN

主要配置文件：

- [package.json](./package.json)：依赖和脚本
- [vite.config.ts](./vite.config.ts)：Vite、端口、别名和打包分块
- [index.html](./index.html)：Tailwind CDN、字体和页面入口
- [index.tsx](./index.tsx)：React 挂载入口
- [App.tsx](./App.tsx)：主路由和全局应用状态

启动命令：

```bash
npm install
npm run dev
```

Vite 开发服务器配置为 `0.0.0.0:3000`。

当前本地验证：`npx tsc --noEmit` 通过，`npm run build` 通过。构建仍提示 Ant Design / vendor bundle 较大，但不是功能错误。`package-lock.json` 已纳入仓库。

## 3. 目录结构

```text
.
├── App.tsx                  # 主应用、路由、认证初始化和保护路由
├── index.tsx                # React 入口
├── types.ts                 # 领域类型、枚举和 API 响应类型
├── services/
│   └── mockBackend.ts       # 实际 Supabase 数据访问层，名称是历史遗留
├── hooks/
│   └── useData.ts           # SWR Feed、用户帖子和当前用户读取
├── pages/
│   ├── LandingPage.tsx      # 首页
│   ├── LoginPage.tsx        # 密码/OTP 登录
│   ├── RegisterPage.tsx     # 已移除；旧路径重定向到登录
│   ├── FeedPage.tsx         # 动态流、发帖和互动
│   ├── ProfilePage.tsx      # 个人资料和个人帖子
│   ├── PostDetailPage.tsx   # 帖子详情和评论树
│   ├── AdminDashboard.tsx   # 已移除；当前无审核后台
│   └── App.tsx              # 疑似历史重复入口，当前未被根 index.tsx 使用
├── components/              # Navbar、图片预览和通用 UI
├── utils/
│   ├── i18n.ts              # 中英文和站点配置上下文
│   └── formatters.ts        # 时间、通知等格式化
└── README.md                # 初始 AI Studio 运行说明
```

## 4. 页面和权限模型

路由定义在 [App.tsx](./App.tsx)：

| 路由 | 页面 | 权限 |
|---|---|---|
| `/` | Landing | 公开 |
| `/login` | 登录 | 未登录 |
| `/register` | 旧注册路径，重定向到 `/login` | 公开 |
| `/journal` | 旅行记录列表 | 公开 |
| `/feed` | 旧路径，重定向到 `/journal` | 公开 |
| `/profile` | 个人资料 | 已登录 |
| `/post/:id` | 单条旅行记录 | 公开 |

当前账户模型只保留登录身份、作者资料和 `ADMIN` 角色；注册审核、会员状态和到期时间模型已移除。

## 5. 前端到 Supabase 的数据流

```text
React 页面
  -> services/mockBackend.ts
  -> @supabase/supabase-js
  -> Supabase Auth / Postgres / Storage / Realtime
```

SWR 只负责前端读取缓存和分页：

- `useFeed()`：调用 `getFeed(page, 10)`，支持无限滚动
- `useUserPosts()`：读取个人帖子
- `useCurrentUser()`：读取当前用户资料

业务服务集中在 [services/mockBackend.ts](./services/mockBackend.ts)，主要包括：

- Auth：`sendOtp`、`verifyOtp`、`signInWithPassword`、`getSession`、`getCurrentUser`、`logout`
- 用户：`updateUserProfile`
- 文件：`uploadImage`
- 首页：仅读取 `site_config.logo_url`
- 帖子：读取、创建、删除、点赞
- 评论：读取、回复、删除和通知创建
- Realtime：通知和 Feed 新帖子

## 6. Supabase 当前基准

### 项目状态

- Project Ref：`dyspuewvcrgzlvoebson`
- 项目名称：`jxfine34's Project`
- 区域：`ap-southeast-2`
- 状态：`ACTIVE_HEALTHY`
- PostgreSQL：17.6.1.052
- 当前 migration 列表：空

GitHub 仓库改名和 Supabase 项目名称是两个独立系统；Supabase 项目名称暂时没有改名。

### public 表

当前已确认以下表存在，并且全部开启了 RLS：

| 表 | 主要用途 |
|---|---|
| `profiles` | 用户资料和内容管理角色 |
| `posts` | 动态帖子和图片 |
| `comments` | 评论和嵌套回复 |
| `likes` | 帖子点赞，`post_id + user_id` 唯一 |
| `notifications` | 评论和回复通知 |
| `site_config` | Logo 配置 |

为了最大程度复用原有 `posts` 表，旅行记录暂不拆分成独立的 trips 表。`posts` 目前增加了三个旅行记录字段：

- `title`：记录标题；已有记录已用正文首行补齐
- `entry_date`：旅行记录发生时间；已有记录已用原创建时间补齐
- `is_published`：是否公开；现有记录默认公开

`profiles.id` 关联 `auth.users.id`。帖子、评论、点赞和通知分别通过外键关联用户或帖子。

### Storage bucket

代码中使用两个 bucket：

- `avatars`
- `posts`

图片上传前会压缩并转换为 WebP。当前只使用头像和帖子图片。

### 当前数据快照

以下是 2026-07-11 读取到的精确数量；本次结构调整没有删除既有业务数据：

| 数据 | 数量 |
|---|---:|
| profiles | 3 |
| posts | 2 |
| comments | 4 |
| likes | 4 |
| notifications | 2 |
| site_config | 1 |

内容概况：

- 3 个用户，昵称为「测试」「测试」「张三」
- 3 个用户在数据库中都是 `ADMIN + ACTIVE`
- 到期时间都是 `2026-05-01`
- 当前日期已超过该日期，因此前端会动态将这些用户判断为 `EXPIRED`
- 2 个帖子，其中一条有 2 张图片
- 4 条评论：3 条顶层评论、1 条回复
- 4 个点赞
- 2 条通知，当前全部已读
- Logo URL 当前为空

## 7. 当前已知问题和风险

以下问题是基准状态的一部分，后续修改时需要明确是否处理：

1. `services/mockBackend.ts` 是真实 Supabase 服务，但文件名仍叫 `mockBackend.ts`，容易误导维护者。
2. 公开旅行记录模式已经启用：匿名用户可以读取已发布记录，登录用户才能写入、点赞、评论和回复。
3. 注册、资料审核和会员续期流程已移除；旧 `/register` 路径仅保留重定向兼容。账户资料仍可在登录后编辑。
4. Supabase URL 和 publishable/anon key 处理逻辑写在前端，并带有默认值；任何情况下都不能放入 service role key。
5. 数据库没有 migration 文件或 migration 历史，结构主要依赖远程数据库和服务文件中的历史 SQL 注释。
6. `getFeed()` 对每个帖子分别查询点赞数、评论数和当前用户点赞状态，存在 N+1 查询问题，数据量增长后需要优化。
7. 本轮已清理 `announcements` 表、`site_config.landing_video_url`、公告/视频前端代码和管理后台内容配置页；并从 `profiles` 删除凭证、续期、审核状态、到期时间和登录时间字段，从 `posts` 删除旧单图字段和旧点赞计数字段。数据库当前 public 表为 `profiles`、`posts`、`comments`、`likes`、`notifications`、`site_config`。
8. 本轮已删除 Storage 的宽泛公共列目录策略、重复 profiles 读取策略、注册/后台写入策略，并补充点赞/通知外键索引。Advisor 仍提示 GraphQL 暴露、RLS 初始化计划优化、通知/资料多重策略和尚未使用索引；这些需要结合实际访问模型继续专项处理。
9. 尚未创建 `admin / admin`：Supabase 安全检查阻止了持久化弱密码管理员账户创建。当前密码登录代码已支持用户名映射到邮箱；既有账户可以在 Supabase SQL Editor 中设置安全密码并提升为管理员。
10. `credentials` Storage bucket 仍有 2 个历史对象。Supabase 禁止直接 SQL 删除 Storage 对象，需要在 Storage API 或 Dashboard 中清理 bucket；前端已经完全不再引用该 bucket。

## 8. 后续修改约定

以后以本文档为基准进行开发时，默认遵守以下约定：

- 修改前先确认是否涉及 Supabase schema、RLS、Storage 或 Auth。
- 涉及数据库结构时，先确认远程当前 schema，再设计 migration；不要只根据代码顶部的旧 SQL 注释修改。
- 涉及用户权限时，优先检查 `role` 和 RLS，不能只依赖前端路由保护。
- 不在前端代码中新增 service role key 或其他秘密密钥。
- 公开页面默认使用 `/journal` 和 `/post/:id`；`/feed` 只作为历史兼容路径。
- 语言资源集中维护在 `utils/i18n.ts`，语言选项由 `LANGUAGE_OPTIONS` 统一驱动，目前支持中文、日文、英文，默认日文。
- 登录入口表达为“写作/管理”，不要重新把登录设为浏览网站的前置门槛。
- 每次业务修改后至少执行 TypeScript/Vite 构建验证；涉及数据库时再执行对应的 Supabase 查询验证。
- 修改数据库前先记录数据影响范围，避免直接改变现有用户、帖子、评论和凭证数据。
- 如需恢复、暂停、迁移或删除 Supabase 项目数据，先单独确认，不把这类外部状态变更当作普通代码修改。

## 9. 新对话快速恢复上下文

在其他对话中继续本项目时，可以直接提供以下信息：

```text
项目目录：/Users/akira/Documents/admin
参考文档：PROJECT_BASELINE.md
Git 仓库：https://github.com/akira3378/admin.git
Supabase Ref：dyspuewvcrgzlvoebson
当前基准日期：2026-07-11
```

如果项目已经发生代码、数据库或业务流程变化，应先更新本文档的“当前数据快照”“已知问题”和“后续修改约定”，再继续新的功能开发。

## 10. 本次旅行主题改造记录

本次已完成：

- 首页从会员门户文案改为旅行记录主题
- 新增公开 `/journal` 路径，并让旧 `/feed` 重定向
- `/post/:id` 改为无需登录即可阅读
- 未登录用户可以看到记录、照片和评论；点赞、评论、回复、删除和发布要求登录
- 登录成功后进入 `/journal`，而不是强制进入受保护的会员 Feed
- 主导航不再把“加入我们/申请会员”作为入口，改为旅行记录和写作入口
- 语言切换从中英改为中文 / 日本語 / English，并由 `LANGUAGE_OPTIONS` 统一维护
- `posts` 增加 `title`、`entry_date`、`is_published`，没有新建重复旅行表
- 清理并收紧帖子、评论、点赞和站点配置相关的关键写入权限
- 删除未使用且路径错误的重复页面入口 `pages/App.tsx`

验证结果：

- `npx tsc --noEmit`：通过
- `npm run build`：通过
- Supabase 项目状态：`ACTIVE_HEALTHY`
