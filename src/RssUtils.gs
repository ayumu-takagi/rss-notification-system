/**
 * RSS記事通知システム - RSS処理ユーティリティ
 * 
 * RSSフィードの取得と処理を行う
 */

/**
 * スプレッドシートからRSSフィードURLを取得
 * @return {Array} フィード情報の配列
 */
function getRssFeedUrls() {
  try {
    // 設定を取得
    const config = getConfig();
    
    // スプレッドシートを取得
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                         SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // RSSシート名
    const rssSheetName = config.rssSheetName;
    
    // RSSシートが存在しない場合は作成
    let rssSheet;
    try {
      rssSheet = spreadsheet.getSheetByName(rssSheetName);
      if (!rssSheet) {
        rssSheet = createRssSheet(spreadsheet, rssSheetName);
      }
    } catch (e) {
      rssSheet = createRssSheet(spreadsheet, rssSheetName);
    }
    
    // データ取得
    const dataRange = rssSheet.getDataRange();
    const values = dataRange.getValues();
    
    // 1行目はヘッダーとして扱う
    if (values.length <= 1) {
      return [];
    }
    
    // フィード情報の配列を作成
    const feeds = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const url = row[0];
      const name = row[1];
      const isEnabled = row[2] !== false; // 明示的にFALSEでなければ有効とする
      const lastFetchTime = row[3] ? new Date(row[3]) : null;
      const errorCount = row[4] || 0;
      
      // URLが空でなく有効なフィードのみ追加
      if (url && isEnabled) {
        feeds.push({
          url: url,
          name: name,
          lastFetchTime: lastFetchTime,
          errorCount: errorCount,
          row: i + 1 // スプレッドシートの行番号（1始まり）
        });
      }
    }
    
    return feeds;
  } catch (error) {
    console.error(`Error getting RSS feed URLs: ${error.message}`);
    throw error;
  }
}

/**
 * RSSシートを作成
 * @param {Spreadsheet} spreadsheet - スプレッドシート
 * @param {string} sheetName - シート名
 * @return {Sheet} 作成したシート
 */
function createRssSheet(spreadsheet, sheetName) {
  const rssSheet = spreadsheet.insertSheet(sheetName);
  
  // ヘッダー設定
  rssSheet.getRange('A1:F1').setValues([['RSS URL', 'フィード名', '有効フラグ', '最終取得日時', 'エラー回数', '既知の記事URL']]);
  rssSheet.getRange('C2:C').insertCheckboxes();
  
  // フォーマット設定
  rssSheet.getRange('A1:F1').setFontWeight('bold');
  rssSheet.setColumnWidth(1, 300);
  rssSheet.setColumnWidth(2, 200);
  rssSheet.setColumnWidth(3, 100);
  rssSheet.setColumnWidth(4, 150);
  rssSheet.setColumnWidth(5, 100);
  rssSheet.setColumnWidth(6, 400); // 既知の記事URLリスト用に広めに設定
  
  // サンプルデータ
  rssSheet.getRange('A2:C2').setValues([['https://news.google.com/rss', 'Googleニュース', true]]);
  
  return rssSheet;
}

/**
 * RSSフィードを取得して解析
 * @param {string} url - RSS URL
 * @return {Object} 解析結果
 */
function fetchRssFeed(url) {
  try {
    // タイムアウト設定（30秒）
    const options = {
      'muteHttpExceptions': true,
      'followRedirects': true,
      'validateHttpsCertificates': true,
      'timeout': 30000
    };
    
    // URLフェッチ
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to fetch RSS feed: ${response.getResponseCode()}`);
    }
    
    const content = response.getContentText();
    const document = XmlService.parse(content);
    const root = document.getRootElement();
    
    // RSS 2.0形式とAtom形式の両方に対応
    const items = [];
    
    // RSSの場合
    if (root.getName() === 'rss') {
      const channel = root.getChild('channel');
      if (!channel) return { items: [] };
      
      const itemElements = channel.getChildren('item');
      
      for (let i = 0; i < itemElements.length; i++) {
        const item = itemElements[i];
        const title = getElementText(item, 'title');
        const link = getElementText(item, 'link');
        const pubDate = getElementText(item, 'pubDate');
        const description = getElementText(item, 'description');
        
        items.push({
          title: title,
          link: link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          description: description
        });
      }
    }
    // Atomの場合
    else if (root.getName() === 'feed') {
      const ns = root.getNamespace();
      const entryElements = root.getChildren('entry', ns);
      
      for (let i = 0; i < entryElements.length; i++) {
        const entry = entryElements[i];
        const title = getElementText(entry, 'title', ns);
        const linkElement = entry.getChild('link', ns);
        const link = linkElement ? linkElement.getAttribute('href').getValue() : '';
        const pubDate = getElementText(entry, 'updated', ns) || getElementText(entry, 'published', ns);
        const contentElement = entry.getChild('content', ns) || entry.getChild('summary', ns);
        const description = contentElement ? contentElement.getText() : '';
        
        items.push({
          title: title,
          link: link,
          pubDate: pubDate ? new Date(pubDate) : new Date(),
          description: description
        });
      }
    }
    
    return { items: items };
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}: ${error.message}`);
    throw error;
  }
}

/**
 * XMLから要素のテキストを取得
 * @param {Element} element - 親要素
 * @param {string} name - 子要素名
 * @param {Namespace} [namespace] - 名前空間
 * @return {string} テキスト
 */
function getElementText(element, name, namespace) {
  const child = namespace ? element.getChild(name, namespace) : element.getChild(name);
  return child ? child.getText() : '';
}

/**
 * 新着記事を確認（URL比較ベース）
 * @param {Array} articles - 記事リスト
 * @param {number} row - スプレッドシートの行番号
 * @return {Array} 新着記事
 */
function checkNewArticles(articles, row) {
  // 既知の記事URLリストを取得
  const knownUrls = getKnownArticleUrls(row);
  
  // 新着記事を抽出（URLが既知のリストにないもの）
  const newArticles = articles.filter(article => {
    return article.link && !knownUrls.includes(article.link);
  });
  
  // 新着がある場合は既知のURLリストを更新
  if (articles.length > 0) {
    // 今回取得した全記事のURLリストを作成（最大100件程度に制限）
    const allUrls = articles
      .filter(article => article.link)
      .map(article => article.link)
      .slice(0, 100);
    saveKnownArticleUrls(row, allUrls);
  }
  
  // 初回実行時（既知URLが空）は最新5件のみ返す
  if (knownUrls.length === 0 && newArticles.length > 5) {
    return newArticles.slice(0, 5);
  }
  
  return newArticles;
}

/**
 * 既知の記事URLリストを取得
 * @param {number} row - スプレッドシートの行番号
 * @return {Array} URLリスト
 */
function getKnownArticleUrls(row) {
  try {
    const config = getConfig();
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                         SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.rssSheetName);
    
    // F列（既知の記事URL）を取得
    const urlsJson = sheet.getRange(row, 6).getValue();
    
    // 空の場合は空配列を返す
    if (!urlsJson) return [];
    
    // JSONをパース
    try {
      return JSON.parse(urlsJson);
    } catch (e) {
      console.error(`Error parsing known URLs JSON: ${e.message}`);
      return [];
    }
  } catch (error) {
    console.error(`Error getting known article URLs: ${error.message}`);
    return [];
  }
}

/**
 * 既知の記事URLリストを保存
 * @param {number} row - スプレッドシートの行番号
 * @param {Array} urls - URLリスト
 */
function saveKnownArticleUrls(row, urls) {
  try {
    const config = getConfig();
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                         SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.rssSheetName);
    
    // JSONに変換してF列に保存
    const urlsJson = JSON.stringify(urls);
    sheet.getRange(row, 6).setValue(urlsJson);
  } catch (error) {
    console.error(`Error saving known article URLs: ${error.message}`);
  }
}

/**
 * 最終取得時刻を更新
 * @param {number} row - 行番号
 * @param {Date} time - 時刻
 */
function updateLastFetchTime(row, time) {
  try {
    // 設定を取得
    const config = getConfig();
    
    // スプレッドシートを取得
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                         SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.rssSheetName);
    
    // D列（最終取得日時）を更新
    sheet.getRange(row, 4).setValue(time);
  } catch (error) {
    console.error(`Error updating last fetch time: ${error.message}`);
  }
}

/**
 * エラーカウントを更新
 * @param {number} row - 行番号
 * @param {boolean} isSuccess - 成功したかどうか
 */
function updateErrorCount(row, isSuccess) {
  try {
    // 設定を取得
    const config = getConfig();
    
    // スプレッドシートを取得
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                         SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(config.rssSheetName);
    
    // 現在のエラーカウントを取得
    const currentCount = sheet.getRange(row, 5).getValue() || 0;
    
    if (isSuccess) {
      // 成功した場合はカウントをリセット
      sheet.getRange(row, 5).setValue(0);
    } else {
      // 失敗した場合はカウントを増やす
      const newCount = currentCount + 1;
      sheet.getRange(row, 5).setValue(newCount);
      
      // 3回連続エラーの場合は無効化
      if (newCount >= 3) {
        sheet.getRange(row, 3).setValue(false);
      }
    }
  } catch (error) {
    console.error(`Error updating error count: ${error.message}`);
  }
}