# RSS記事通知システム

GoogleスプレッドシートにRSSフィードのURLリストを管理し、毎日定時に新着記事をチェックしてGoogle Chatに通知するシステム。

## 機能概要

- GoogleスプレッドシートからRSSフィードURLリストを取得
- 各RSSフィードから新着記事を取得
- 新着記事をGoogle Chatの指定チャンネルに通知
- 毎日6時に自動実行

## セットアップ方法

セットアップは以下の2つの方法から選べます：

- **方法A**: GASエディタで直接コードを編集（コード管理なし）
- **方法B**: claspでローカル開発・デプロイ（コード管理あり）

### 方法A：GASエディタで直接セットアップ

#### 1. Google Chat Webhook設定

1. Google Chatで通知先のスペースを開く
2. スペース名をクリック → 「アプリと統合」を選択
3. 「Webhookを管理」をクリック
4. 「Webhook を追加」をクリック
5. 必要事項を入力：
   - 名前：「RSS通知」
   - アバターURL：任意のアイコン画像URL
   - （オプション）説明：「RSSの新着記事を通知します」
6. 「保存」をクリックして発行されたURLをコピー

#### 2. スプレッドシート準備

1. 新規Googleスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を選択
3. src/ディレクトリ内の各.gsファイルの内容をGASエディタに貼り付け
   - 同名のファイルを作成（Code.gs, Config.gs等）
   - appsscript.jsonの内容も設定から反映
4. プロジェクト設定からスクリプトプロパティを設定：
   - `WEBHOOK_URL`: 上記で取得したWebhook URL

#### 3. トリガー設定

1. エディタで「setupTrigger」関数を実行

### 方法B：claspでセットアップ（詳細は後述）

1. リポジトリをローカルに準備
2. claspをセットアップしてGASとの連携設定
3. コードをプッシュしてWebhook URLなどを設定

## 開発・デプロイ手順

### 1. 開発環境セットアップ

```bash
# プロジェクトディレクトリに移動
cd rss-notification-system

# claspをプロジェクトローカルにインストール
npm install @google/clasp --save-dev

# .clasp.jsonの作成
cp .clasp.json.example .clasp.json
```

### 2. スクリプトIDの設定

`.clasp.json` ファイルを開き、GASプロジェクトのスクリプトIDを設定します：

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "src"
}
```

スクリプトIDの確認方法:
- GASエディタで「プロジェクトの設定」を開く
- 「スクリプトID」の値をコピー

### 3. Google Apps Script APIの有効化

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択
3. APIとサービス > ライブラリ
4. 「Google Apps Script API」を検索して有効化

### 4. claspにログインしてGASにデプロイ

```bash
# ログイン（ブラウザが開き認証が要求されます）
npx clasp login

# GASにコードをプッシュ
npx clasp push

# または、package.jsonのスクリプトを利用
npm run login
npm run push
```

### 5. スクリプトプロパティの設定

1. `npm run open` または `npx clasp open` でGASエディタを開く
2. 「プロジェクトの設定」→「スクリプトプロパティ」を選択
3. 以下のプロパティを追加：
   - `WEBHOOK_URL`: Google ChatのWebhook URL
   - `SHEET_ID`: (オプション) スプレッドシートID
   - `RSS_SHEET_NAME`: (オプション) RSSシート名
   - `CONFIG_SHEET_NAME`: (オプション) 設定シート名

### 6. 権限とトリガーの設定

1. GASエディタで `setupTrigger` 関数を実行
2. 必要な権限をすべて許可
3. 手動実行で初期設定を確認：`main` 関数を実行

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