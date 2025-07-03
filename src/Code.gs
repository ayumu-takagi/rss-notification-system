/**
 * RSS記事通知システム - メインスクリプト
 * 
 * GoogleスプレッドシートからRSSフィードのURLを取得し、
 * 新着記事をGoogle Chatに通知するシステム
 */

/**
 * メイン処理 - トリガーから実行されるエントリーポイント
 */
function main() {
  try {
    // 設定を取得
    const config = getConfig();
    
    // RSSフィードURLを取得
    const feeds = getRssFeedUrls();
    
    // 各フィードを処理
    for (let i = 0; i < feeds.length; i++) {
      const feed = feeds[i];
      
      try {
        // RSSフィード取得と解析
        const feedData = fetchRssFeed(feed.url);
        
        if (!feedData || !feedData.items || feedData.items.length === 0) {
          updateErrorCount(feed.row, false);
          continue;
        }
        
        // 新着記事を確認
        const newArticles = checkNewArticles(feedData.items, feed.lastFetchTime);
        
        // 新着記事があれば通知
        if (newArticles.length > 0) {
          sendToGoogleChat(feed.name || feed.url, newArticles);
        }
        
        // 最終取得時間を更新
        updateLastFetchTime(feed.row, new Date());
        
        // エラーカウントをリセット
        updateErrorCount(feed.row, true);
        
      } catch (error) {
        // フィード個別のエラー処理
        console.error(`Error processing feed ${feed.url}: ${error.message}`);
        updateErrorCount(feed.row, false);
      }
    }
  } catch (error) {
    // 全体エラー処理
    console.error(`Error in main process: ${error.message}`);
    sendErrorNotification(error);
  }
}

/**
 * トリガー設定用関数 - 手動で一度だけ実行する
 */
function setupTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // 毎日6時に実行するトリガーを設定
  ScriptApp.newTrigger('main')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
    
  console.log('Trigger set for 6AM daily');
}

/**
 * 手動実行用関数
 */
function runManually() {
  main();
}