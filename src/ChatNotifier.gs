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
    
    // カード形式のペイロードを作成
    const cardHeader = {
      "title": config.notificationTitle,
      "subtitle": `${feedName} - 新着記事 ${articles.length}件`,
      "imageUrl": config.iconUrl || "https://www.gstatic.com/images/icons/material/system/2x/rss_feed_black_48dp.png"
    };
    
    const sections = [];
    
    // 記事ごとのセクションを作成
    articles.forEach(article => {
      // 日時のフォーマット
      const pubDate = article.pubDate instanceof Date ? 
                      Utilities.formatDate(article.pubDate, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm') : 
                      '日時不明';
      
      // カードセクション作成
      sections.push({
        "widgets": [
          {
            "textParagraph": {
              "text": `<b>${article.title || 'タイトルなし'}</b><br>${pubDate}`
            }
          },
          {
            "buttonList": {
              "buttons": [
                {
                  "text": "記事を開く",
                  "onClick": {
                    "openLink": {
                      "url": article.link
                    }
                  }
                }
              ]
            }
          },
          {
            "decoratedText": {
              "text": article.description ? article.description.substring(0, 300) + (article.description.length > 300 ? '...' : '') : '',
              "wrapText": true
            }
          },
          {
            "divider": {}
          }
        ]
      });
    });
    
    // ペイロード作成
    const payload = {
      "cards": [
        {
          "header": cardHeader,
          "sections": sections
        }
      ]
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