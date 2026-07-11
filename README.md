# Nothing Journal

[English](#english) / [Demo](https://admin-neon-rho.vercel.app)

Nothing Journal は、個人の旅の記録を公開する旅行ジャーナルです。ログインしていない訪問者も公開された旅行記録、写真、場所、コメントを閲覧できます。ログインした作者は記録の公開、いいね、コメント、返信、プロフィール編集を行えます。

## ポートフォリオ上の位置づけ

このプロジェクトでは、認証、永続化されたユーザーコンテンツ、権限境界、多言語の投稿ワークフローなど、プロダクトとバックエンド側の設計を示しています。対して [Tokyo Rail Disruption Map](https://github.com/akira3378/tokyo-rail-disruption-map) は、ユーザーアカウントやコンテンツ所有権ではなく、第三者データの取得、server API、データ変換を中心にしています。

## 主な機能

- `/journal` で公開旅行記録を閲覧
- `/post/:id` で個別の旅行記録を表示
- ログイン後の投稿、いいね、コメント、返信、プロフィール編集
- 日本語・英語・中国語の切り替え
- ライトテーマ / ダークテーマ
- Supabase Auth、Postgres、Storage、Realtime の利用

## バックエンドとインタラクション

- Supabase Auth によって、公開閲覧とログイン後の作者操作を分離しています。
- Postgres にはプロフィール、旅行記録、コメント、いいね、通知を保存します。
- Storage ではアバターと投稿画像を扱い、Realtime でソーシャル操作を反映します。
- ブラウザ側の公開クライアントキーと、RLS によるデータアクセス制御を組み合わせています。
- 公開閲覧者、ログイン済み作者、管理操作の責務を分けています。

## ローカルでの起動

Node.js 20 以上が必要です。

```bash
npm install
npm run dev
```

Vite の開発サーバーは `3000` ポートで起動します。

## Supabase の設定

認証とデータ保存には設定済みの Supabase プロジェクトを使用します。ブラウザ側では publishable / anon key を使用できますが、RLS ポリシーを正しく設定する必要があります。

Supabase の `service_role` キー、データベースパスワード、非公開トークンなどのサーバー秘密情報を、リポジトリや `VITE_*` 変数に入れないでください。

## 本番デプロイ

- Demo: [https://admin-neon-rho.vercel.app](https://admin-neon-rho.vercel.app)
- GitHub: [akira3378/nothing-journal](https://github.com/akira3378/nothing-journal)
- Vercel プロジェクト: `nothing-journal`

`main` に push すると Vercel が自動的に本番デプロイを開始します。

```bash
git add .
git commit -m "変更内容"
git push origin main
```

## 更新履歴

実装の変化は、実際のコミット時系列に合わせて [CHANGELOG.md](CHANGELOG.md) に整理しています。

## ディレクトリ構成

```text
App.tsx                    # ルーティングとアプリ状態
components/                # 共通 UI コンポーネント
hooks/useData.ts           # SWR データフック
pages/                     # ジャーナル、プロフィール、ログイン、記録ページ
services/supabaseBackend.ts # Supabase データアクセス層
utils/i18n.ts              # 中国語 / 日本語 / 英語の言語リソース
PROJECT_BASELINE.md        # 現在のプロジェクトとデプロイ基準
```

## チェックコマンド

```bash
npx tsc --noEmit
npm run build
```

---

# Nothing Journal {#english}

[日本語](#nothing-journal) / [Demo](https://admin-neon-rho.vercel.app)

Nothing Journal is a public personal travel journal. Visitors can browse published notes, photos, places, and comments. Signed-in authors can publish notes and interact with the journal.

## Portfolio focus

This project represents the product and backend side of the portfolio: authentication, persistent user-generated content, authorization boundaries, and a multilingual publishing workflow. Its companion project, [Tokyo Rail Disruption Map](https://github.com/akira3378/tokyo-rail-disruption-map), focuses on third-party data ingestion and server-side API boundaries instead of user accounts and content ownership.

## Features

- Public journal browsing at `/journal`
- Individual travel notes at `/post/:id`
- Signed-in writing, likes, comments, replies, and profile editing
- Japanese, English, and Chinese language switching
- Light and dark themes
- Supabase Auth, Postgres, Storage, and Realtime integration

## Backend and interaction model

- Supabase Auth separates public browsing from signed-in author actions.
- Postgres stores profiles, journal posts, comments, likes, and notifications.
- Storage handles avatars and post images; Realtime keeps social interactions responsive.
- The frontend uses a public-client Supabase key while database access is constrained by RLS policies.
- The application keeps public-reader, authenticated-author, and administrative responsibilities visibly separate.

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

The Vite development server runs on port `3000`.

## Supabase configuration

The application uses the configured Supabase project for authentication and data. The browser client may use a publishable/anon key; this key is designed for public clients and must be protected by correct RLS policies.

Never put a Supabase `service_role` key, database password, private token, or other server secret in this repository or in a `VITE_*` variable.

## Production deployment

- Demo: [https://admin-neon-rho.vercel.app](https://admin-neon-rho.vercel.app)
- GitHub: [akira3378/nothing-journal](https://github.com/akira3378/nothing-journal)
- Vercel project: `nothing-journal`

Vercel deploys production automatically after a successful push to `main`:

```bash
git add .
git commit -m "your change"
git push origin main
```

## Project history

The implementation history is summarized in [CHANGELOG.md](CHANGELOG.md), with entries aligned to the project commit timeline.

## Project structure

```text
App.tsx                    # routing and application state
components/                # shared interface components
hooks/useData.ts           # SWR data hooks
pages/                     # journal, profile, login, and note pages
services/supabaseBackend.ts # Supabase data access layer
utils/i18n.ts              # zh / ja / en language resources
PROJECT_BASELINE.md        # current project and deployment reference
```

## Tests and checks

```bash
npx tsc --noEmit
npm run build
```
