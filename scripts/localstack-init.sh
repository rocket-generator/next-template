#!/bin/bash

# LocalStack初期化スクリプト
# S3バケット作成とSES設定を行う

set -e

echo "LocalStack初期化を開始します..."

# S3バケットの作成
echo "S3バケット 'my-app-bucket' を作成中..."
awslocal s3 mb s3://my-app-bucket || echo "バケットは既に存在します"

# S3バケットのCORS設定
echo "S3バケットのCORS設定を行います..."
awslocal s3api put-bucket-cors --bucket my-app-bucket --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# SESメールアドレスの確認
echo "SESメールアドレスを確認します..."
awslocal ses verify-email-identity --email-address test@example.com
awslocal ses verify-email-identity --email-address noreply@example.com
awslocal ses verify-email-identity --email-address noreply@localhost

# SES送信統計の確認
echo "SES設定を確認します..."
awslocal ses get-send-statistics

echo "LocalStack初期化が完了しました！"
echo "S3エンドポイント: http://localhost:4566"
echo "SESエンドポイント: http://localhost:4566"
echo "S3バケット: my-app-bucket"
echo "確認済みメールアドレス: test@example.com, noreply@example.com, noreply@localhost"