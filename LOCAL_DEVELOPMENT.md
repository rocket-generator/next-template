# INSTALL_LOCAL.md

このドキュメントは、ローカル開発環境を `docker compose` ベースで起動する手順をまとめたものです。  
コマンドはすべてリポジトリ直下で実行します。

## 1. 前提

- Docker Desktop もしくは Docker Engine + Compose Plugin が利用できること
- `localhost:3000`, `localhost:4566`, `localhost:5433` が空いていること

## 2. 起動対象

`docker compose up -d --build` で次のサービスが立ち上がります。

- `web`: Next.js 開発サーバー
- `postgres`: PostgreSQL
- `localstack`: S3 / SES / SQS のローカルエミュレータ
- `ls-viewer`: S3やSESの結果をローカルで参照するためのサーバ（ http://localhost:3200 で起動します）。これは必須ではありません。

## 3. 最短手順

```bash
cd code
docker compose up -d --build
docker compose exec -T web npx prisma db push
docker compose exec -T web npx prisma db seed
```

起動後の主要 URL:

- アプリ: [http://localhost:3000](http://localhost:3000)
- LocalStack endpoint: [http://localhost:4566](http://localhost:4566)
- PostgreSQL: `localhost:5433`
- LS Viewer: http://localhost:3200


## 4. 動作確認

### 4.1 コンテナ状態

```bash
cd code
docker compose ps
```

少なくとも `web`,  `postgres`, `localstack` が `Up` になっていることを確認します。


### 4.2 LocalStack 初期化確認

```bash
cd code
docker compose logs localstack
```

以下が出ていれば初期化は概ね成功です。

- S3 bucket `my-app-bucket` 作成
- SQS queue `async-worker-main` / `async-worker-dlq` 作成
- SES identity 確認

## 5. よく使うコマンド

```bash
cd code

# 停止
docker compose down

# DB データも含めて初期化
docker compose down -v

# web / worker のログ追跡
docker compose logs -f web

# Prisma Studio
docker compose exec web npx prisma studio
```

## 6. トラブルシュート

### 6.1 依存を追加したのにコンテナへ反映されない

`package.json` / `package-lock.json` を変えた後は build し直してください。

```bash
cd code
docker compose up -d --build
```

### 6.2 DB を作り直したい

```bash
cd code
docker compose down -v
docker compose up -d --build
docker compose exec -T web npx prisma db push
docker compose exec -T web npx prisma db seed
```
