/**
 * RSS記事通知システム - Google Chat通知
 * 
 * Google Chatへの通知機能
 */

/**
 * Google Chatに通知を送信
 * @param {string} feedName - フィード名
 * @param {Array} articles - 記事リスト
 */
function sendToGoogleChat(feedName, articles) {
  try {
    // 設定情報を取得
    const config = getConfig();
    const webhookUrl = config.webhookUrl;
    
    if (!webhookUrl) {
      throw new Error('Webhook URL is not set');
    }
    
    // 記事がない場合は何もしない
    if (!articles || articles.length === 0) {
      return;
    }
    
    // シンプルなテキスト形式でのメッセージを作成
    let text = `*${config.notificationTitle}*\n`;
    text += `${feedName} - 新着記事 ${articles.length}件\n\n`;
    
    // 記事ごとのテキストを作成
    articles.forEach(article => {
      // 日時のフォーマット
      const pubDate = article.pubDate instanceof Date ? 
                      Utilities.formatDate(article.pubDate, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm') : 
                      '日時不明';
      
      // 記事情報（Descriptionなし）
      text += `*${article.title || 'タイトルなし'}*\n`;
      text += `${pubDate}\n`;
      text += `${article.link}\n`;
      
      text += `\n---\n\n`;  // 記事間の区切り
    });
    
    // ペイロード作成
    const payload = {
      "text": text
    };
    
    // HTTPリクエスト設定
    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    // 送信
    const response = UrlFetchApp.fetch(webhookUrl, options);
    
    if (response.getResponseCode() !== 200) {
      console.error(`Error sending to Google Chat: ${response.getContentText()}`);
    }
  } catch (error) {
    console.error(`Error sending to Google Chat: ${error.message}`);
    throw error;
  }
}