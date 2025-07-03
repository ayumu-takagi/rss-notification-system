# RSS記事通知システム

GoogleスプレッドシートにRSSフィードのURLリストを管理し、毎日定時に新着記事をチェックしてGoogle Chatに通知するシステム。

## 機能概要

- GoogleスプレッドシートからRSSフィードURLリストを取得
- 各RSSフィードから新着記事を取得
- 新着記事をGoogle Chatの指定チャンネルに通知
- 毎日6時に自動実行

## セットアップ方法

### 1. Google Chat Webhook設定

1. Google Chatで通知先のスペースを開く
2. スペース名をクリック → 「アプリと統合」を選択
3. 「Webhookを管理」をクリック
4. 「Webhook を追加」をクリック
5. 必要事項を入力：
   - 名前：「RSS通知」
   - アバターURL：任意のアイコン画像URL
   - （オプション）説明：「RSSの新着記事を通知します」
6. 「保存」をクリックして発行されたURLをコピー

### 2. スプレッドシート準備

1. 新規Googleスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を選択
3. 全てのコードをこのリポジトリのコードに置き換え
4. プロジェクト設定からスクリプトプロパティを設定：
   - `WEBHOOK_URL`: 上記で取得したWebhook URL

### 3. トリガー設定

1. エディタで「setupTrigger」関数を実行

## リポジトリ管理方法

### claspの設定

```bash
# claspのインストール
npm install -g @google/clasp

# claspにログイン
clasp login

# .clasp.jsonの作成（.clasp.json.exampleをコピー）
cp .clasp.json.example .clasp.json
# スクリプトIDを設定

# GASへプッシュ
clasp push
```

## ファイル構成

- `Code.gs` - メインスクリプト
- `Config.gs` - 設定関連の処理
- `RssUtils.gs` - RSS処理ユーティリティ
- `ChatNotifier.gs` - Google Chat通知処理
- `ErrorHandler.gs` - エラーハンドリング処理

## 運用方法

### スプレッドシート構成

#### RSSシート
| 列名 | 内容 | 型 | 備考 |
|------|------|-----|------|
| A列 | RSS URL | 文字列 | 必須 |
| B列 | フィード名 | 文字列 | 任意（空白時はURLを表示） |
| C列 | 有効フラグ | TRUE/FALSE | 通知対象の制御 |
| D列 | 最終取得日時 | 日時 | システムが自動更新 |
| E列 | エラー回数 | 数値 | 連続エラー回数を記録 |

#### Configシート
| 列名 | 内容 | 型 | 備考 |
|------|------|-----|------|
| A1 | 管理者メールアドレス | 文字列 | エラー通知先 |
| A2 | 通知タイトル | 文字列 | Chat通知のタイトル |
| A3 | アイコンURL | 文字列 | 通知時のアイコン画像 |