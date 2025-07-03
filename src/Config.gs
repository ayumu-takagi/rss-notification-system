/**
 * RSS記事通知システム - 設定管理
 * 
 * 設定情報の取得と管理を行う
 */

/**
 * 設定情報を取得
 * @return {Object} 設定情報
 */
function getConfig() {
  try {
    // スプレッドシートを取得
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                          SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // 設定シート名を取得
    const configSheetName = PropertiesService.getScriptProperties().getProperty('CONFIG_SHEET_NAME') || 'Config';
    
    // 設定シートが存在しない場合は作成
    let configSheet;
    try {
      configSheet = spreadsheet.getSheetByName(configSheetName);
      if (!configSheet) {
        configSheet = createConfigSheet(spreadsheet, configSheetName);
      }
    } catch (e) {
      configSheet = createConfigSheet(spreadsheet, configSheetName);
    }
    
    // 設定値を取得
    const adminEmail = configSheet.getRange('A1').getValue() || Session.getActiveUser().getEmail();
    const notificationTitle = configSheet.getRange('A2').getValue() || 'RSS更新通知';
    const iconUrl = configSheet.getRange('A3').getValue() || '';
    
    // Webhook URLはスクリプトプロパティから取得
    const webhookUrl = PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('Webhook URL is not set. Please set WEBHOOK_URL in script properties.');
    }
    
    return {
      adminEmail: adminEmail,
      notificationTitle: notificationTitle,
      iconUrl: iconUrl,
      webhookUrl: webhookUrl,
      rssSheetName: PropertiesService.getScriptProperties().getProperty('RSS_SHEET_NAME') || 'RSS'
    };
  } catch (error) {
    console.error(`Error getting config: ${error.message}`);
    throw error;
  }
}

/**
 * 設定シートを作成
 * @param {Spreadsheet} spreadsheet - スプレッドシート
 * @param {string} sheetName - シート名
 * @return {Sheet} 作成したシート
 */
function createConfigSheet(spreadsheet, sheetName) {
  const configSheet = spreadsheet.insertSheet(sheetName);
  
  // ヘッダー設定
  configSheet.getRange('A1:B1').setValues([['管理者メールアドレス', '']]);
  configSheet.getRange('A2:B2').setValues([['通知タイトル', 'RSS更新通知']]);
  configSheet.getRange('A3:B3').setValues([['アイコンURL', '']]);
  
  // フォーマット設定
  configSheet.getRange('A1:A3').setFontWeight('bold');
  configSheet.setColumnWidth(1, 200);
  configSheet.setColumnWidth(2, 300);
  
  return configSheet;
}