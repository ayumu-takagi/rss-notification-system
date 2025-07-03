/**
 * RSS記事通知システム - エラーハンドリング
 * 
 * エラー処理と通知機能
 */

/**
 * エラー通知メールを送信
 * @param {Error} error - エラーオブジェクト
 */
function sendErrorNotification(error) {
  try {
    // 設定情報を取得
    const config = getConfig();
    const adminEmail = config.adminEmail;
    
    if (!adminEmail) {
      console.error('Admin email is not set. Cannot send error notification.');
      return;
    }
    
    // エラーメッセージ作成
    let errorMessage = '';
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}\n${error.stack || 'No stack trace available'}`;
    } else {
      errorMessage = String(error);
    }
    
    // スプレッドシート情報
    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || 
                          SpreadsheetApp.getActiveSpreadsheet().getId();
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    // メール本文作成
    const body = `RSS記事通知システムでエラーが発生しました。
    
エラー詳細:
${errorMessage}

発生時刻: ${new Date().toString()}

スプレッドシート: ${spreadsheetUrl}

このメールはGoogle Apps Scriptにより自動送信されています。`;
    
    // メール送信
    MailApp.sendEmail({
      to: adminEmail,
      subject: '[RSS通知] エラー発生',
      body: body
    });
    
    console.log(`Error notification sent to ${adminEmail}`);
  } catch (error) {
    console.error(`Error sending notification: ${error.message}`);
  }
}