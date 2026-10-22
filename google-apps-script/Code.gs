/**
 * ==============================================================================
 * Google Apps Script for "Memo All In One"
 * Google Sheets Central Logging, Drive Auto-Sync & Attachments Storage
 * ==============================================================================
 * 
 * Target Google Drive Folder:
 * URL: https://drive.google.com/drive/u/0/folders/1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3
 * Folder ID: 1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3
 * Account: mayomco@gmail.com
 * 
 * Instructions:
 * 1. Open Google Sheet or create a new one.
 * 2. Extensions (ส่วนขยาย) > Apps Script
 * 3. Paste this code into Code.gs
 * 4. Deploy (การทำให้ใช้งานได้) > New deployment (การทำให้ใช้งานได้ใหม่)
 * 5. Type: Web app (เว็บแอป)
 *    - Execute as: Me (ฉัน)
 *    - Who has access: Anyone (ทุกคน)
 * 6. Copy the Web app URL and paste into Memo All In One -> Settings -> Google Apps Script Webhook URL
 */

const ROOT_FOLDER_ID = '1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3';
const SPREADSHEET_ID = '1JpBrTgqbM0VbRTVPbDFwkY2__W1AkLSxtljKJs_4Xl8';
const DEFAULT_SHEET_NAME = 'ทะเบียนคุมเอกสาร (Document Logs)';

/**
 * Handle HTTP GET - Health check & Status test
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    system: 'Memo All In One - Google Sheets & Drive Webhook API',
    targetFolderId: ROOT_FOLDER_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST - Log Document to Google Sheet, Upload PDF & Attachments to Drive
 */
function doPost(e) {
  try {
    let contents = e.postData ? e.postData.contents : '';
    let data = {};
    if (contents) {
      data = JSON.parse(contents);
    }
    const action = data.action || 'log_document';

    // 1. Health & Connection Test
    if (action === 'test_connection') {
      const sheet = getOrCreateLogSheet();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Sheet & Apps Script เชื่อมต่อสำเร็จสมบูรณ์',
        sheetName: sheet.getName(),
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet() ? SpreadsheetApp.getActiveSpreadsheet().getName() : 'Google Drive Central',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Log Document to Sheet & Drive
    if (action === 'log_document' || action === 'upload_document') {
      const result = processDocumentRecord(data);
      
      // If email recipient is requested, send email as well
      if (data.recipientEmail) {
        sendDocumentEmail(data, result.pdfFile, result.attachmentUrls);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'บันทึกข้อมูลลง Google Sheet และ Google Drive สำเร็จเรียบร้อย',
        sheetRow: result.sheetRow,
        docNumber: data.docNumber,
        fileUrl: result.pdfUrl,
        attachmentUrls: result.attachmentUrls
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Send Custom Email
    if (action === 'send_email') {
      sendCustomEmail(data);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Process document: Save PDF & attachments to Drive, then record row in Google Sheet
 */
function processDocumentRecord(data) {
  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  
  const companyName = data.company || 'ทั่วไป';
  const docYear = (new Date(data.date || new Date())).getFullYear() + 543;
  const docTypeNames = {
    'memo': 'บันทึกภายใน',
    'announcement': 'ประกาศ',
    'salary_cert': 'หนังสือรับรองเงินเดือน',
    'work_cert': 'หนังสือรับรองการทำงาน'
  };
  const typeName = docTypeNames[data.docType] || data.headerTitle || 'เอกสารทั่วไป';

  // 1. Get or Create Company Folder & Year Folder
  const companyFolder = getOrCreateSubFolder(rootFolder, companyName);
  const yearFolder = getOrCreateSubFolder(companyFolder, 'ปี ' + docYear);
  const targetFolder = getOrCreateSubFolder(yearFolder, typeName);

  // Standard corporate filename formatting: "[COMPANY_PREFIX] [SUBJECT]+[DATE]"
  let prefix = 'TWP';
  const cCode = (data.companyCode || '').toUpperCase();
  const cName = data.company || '';
  if (cCode === 'TWP' || cName.includes('ไทยวัฒนา')) prefix = 'TWP';
  else if (cCode === 'LMI' || cName.includes('ล๊อกแมท')) prefix = 'LMI';
  else if (cCode === 'NNAP' || cCode.startsWith('NNA') || cName.includes('เหนือน้ำ')) prefix = 'NNAP';
  else if (cCode) prefix = cCode;

  const docDate = data.date || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  const sanitizedDocNo = (data.docNumber || 'DOC-' + Date.now()).replace(/[/\\?%*:|"<>]/g, '-');
  const sanitizedSubject = (data.subject || typeName || 'บันทึกข้อความ').replace(/[/\\?%*:|"<>]/g, ' ').trim();
  
  // Use client-generated standard filename if provided, otherwise compute standard
  const baseFileName = (data.fileName && data.fileName.trim())
    ? data.fileName.replace(/\.pdf$/i, '')
    : `${prefix} ${sanitizedSubject}+${docDate}`;

  let pdfUrl = '';
  let createdPdf = null;

  // 2. Generate PDF from HTML if htmlContent provided
  if (data.htmlContent) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${baseFileName}</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; font-size: 15pt; line-height: 1.5; color: #000; padding: 20mm; }
          p { text-indent: 2.5cm; margin-bottom: 12pt; text-align: justify; }
        </style>
      </head>
      <body>
        ${data.htmlContent}
      </body>
      </html>
    `;

    const htmlBlob = Utilities.newBlob(htmlContent, 'text/html', `${baseFileName}.html`);
    const pdfBlob = htmlBlob.getAs('application/pdf').setName(`${baseFileName}.pdf`);
    createdPdf = targetFolder.createFile(pdfBlob);
    try {
      createdPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Could not set public sharing on PDF: ' + shareErr);
    }
    pdfUrl = createdPdf.getUrl();
  }

  // 3. Process & Upload File Attachments to Drive
  const attachmentUrls = [];
  const attachmentNames = [];
  if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
    const attachmentsFolder = getOrCreateSubFolder(targetFolder, `${sanitizedDocNo} - เอกสารแนบ`);
    
    data.attachments.forEach((att, idx) => {
      try {
        if (att.dataUrl) {
          const parts = att.dataUrl.split(',');
          const meta = parts[0];
          const base64Data = parts[1] || '';
          const mimeMatch = meta.match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : (att.type || 'application/octet-stream');
          
          const bytes = Utilities.base64Decode(base64Data);
          const blob = Utilities.newBlob(bytes, mimeType, att.name || `attachment_${idx + 1}`);
          const attFile = attachmentsFolder.createFile(blob);
          try {
            attFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (attShareErr) {
            Logger.log('Could not set public sharing on attachment: ' + attShareErr);
          }
          attachmentUrls.push(attFile.getUrl());
          attachmentNames.push(att.name);
        }
      } catch (attErr) {
        Logger.log('Attachment upload error: ' + attErr.toString());
      }
    });
  }

  // 4. Record to Google Sheet
  const sheet = getOrCreateLogSheet();
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  
  const attachmentsListText = attachmentNames.length > 0 
    ? attachmentNames.join(', ') 
    : (data.attachmentsNames || '-');

  const attachmentUrlsText = attachmentUrls.length > 0 
    ? attachmentUrls.join('\n') 
    : '-';

  const rowData = [
    timestamp,                                    // 1. วัน-เวลาบันทึก
    data.docNumber || '-',                        // 2. เลขที่เอกสาร
    data.company || '-',                          // 3. บริษัท
    typeName,                                     // 4. ประเภทเอกสาร
    data.subject || '-',                          // 5. เรื่อง
    data.toRecipient || '-',                      // 6. เรียน (ผู้รับ)
    data.signerName || '-',                       // 7. ผู้ลงนาม
    data.signerPosition || '-',                   // 8. ตำแหน่ง
    data.department || '-',                       // 9. หน่วยงาน
    data.date || '-',                             // 10. วันที่เอกสาร
    data.attachmentsCount || attachmentUrls.length || 0, // 11. จำนวนไฟล์แนบ
    attachmentsListText,                          // 12. รายชื่อไฟล์แนบ
    pdfUrl || '-',                                // 13. ลิงก์เอกสาร PDF (Drive)
    attachmentUrlsText,                           // 14. ลิงก์ไฟล์แนบ (Drive)
    data.status || 'published'                    // 15. สถานะ
  ];

  sheet.appendRow(rowData);
  const lastRow = sheet.getLastRow();

  // If we have PDF URL, format as clickable hyperlink with standard filename
  if (pdfUrl) {
    sheet.getRange(lastRow, 13).setFormula(`=HYPERLINK("${pdfUrl}", "${baseFileName}.pdf")`);
  }

  return {
    sheetRow: lastRow,
    pdfFile: createdPdf,
    pdfUrl: pdfUrl,
    attachmentUrls: attachmentUrls
  };
}

/**
 * Get or create the log sheet with professional Thai corporate styling
 */
function getOrCreateLogSheet() {
  let spreadsheet = null;
  // 1. Try opening via hardcoded or configured SPREADSHEET_ID
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log('Could not open spreadsheet by ID: ' + e);
    }
  }

  // 2. Fallback to active container spreadsheet
  if (!spreadsheet) {
    try {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {}
  }

  // 3. Fallback to search or create in ROOT_FOLDER_ID
  if (!spreadsheet) {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const files = rootFolder.getFilesByName('Memo All In One - ทะเบียนคุมเอกสาร');
    if (files.hasNext()) {
      const file = files.next();
      spreadsheet = SpreadsheetApp.openById(file.getId());
    } else {
      spreadsheet = SpreadsheetApp.create('Memo All In One - ทะเบียนคุมเอกสาร');
      const file = DriveApp.getFileById(spreadsheet.getId());
      file.moveTo(rootFolder);
    }
  }

  let sheet = spreadsheet.getSheetByName(DEFAULT_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(DEFAULT_SHEET_NAME);
    
    // Setup Header Row
    const headers = [
      'วัน-เวลาบันทึก',
      'เลขที่เอกสาร',
      'บริษัท',
      'ประเภทเอกสาร',
      'เรื่อง',
      'เรียน (ผู้รับ)',
      'ผู้ลงนาม',
      'ตำแหน่ง',
      'หน่วยงาน',
      'วันที่เอกสาร',
      'จำนวนไฟล์แนบ',
      'รายชื่อไฟล์แนบ',
      'เอกสาร PDF (Google Drive)',
      'ไฟล์แนบ (Google Drive)',
      'สถานะ'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Style Header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0284c7');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Sarabun');
    headerRange.setFontSize(11);
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);

    // Set Column Widths
    sheet.setColumnWidth(1, 160); // Timestamp
    sheet.setColumnWidth(2, 170); // Doc No
    sheet.setColumnWidth(3, 200); // Company
    sheet.setColumnWidth(4, 140); // Type
    sheet.setColumnWidth(5, 260); // Subject
    sheet.setColumnWidth(6, 170); // Recipient
    sheet.setColumnWidth(7, 160); // Signer
    sheet.setColumnWidth(8, 160); // Position
    sheet.setColumnWidth(9, 140); // Department
    sheet.setColumnWidth(10, 110); // Date
    sheet.setColumnWidth(11, 100); // Attach count
    sheet.setColumnWidth(12, 220); // Attach names
    sheet.setColumnWidth(13, 200); // PDF link
    sheet.setColumnWidth(14, 220); // Attach links
    sheet.setColumnWidth(15, 110); // Status
  }

  return sheet;
}

/**
 * Helper to get or create subfolder in Google Drive
 */
function getOrCreateSubFolder(parentFolder, subFolderName) {
  const folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subFolderName);
}

/**
 * Send Email with PDF attachment via GmailApp
 */
function sendDocumentEmail(data, pdfFile, attachmentUrls) {
  const recipient = data.recipientEmail;
  const subject = `[เอกสารทางการ] ${data.docNumber || ''} - ${data.subject || ''}`;
  
  let attachLinksText = '';
  if (attachmentUrls && attachmentUrls.length > 0) {
    attachLinksText = '\nไฟล์แนบประกอบเอกสาร:\n' + attachmentUrls.join('\n');
  }

  const body = `
เรียน ท่านที่เกี่ยวข้อง

ขอส่งเอกสารทางการดังต่อไปนี้:
- เลขที่เอกสาร: ${data.docNumber || '-'}
- เรื่อง: ${data.subject || '-'}
- ออกโดย: ${data.company || '-'}
- ผู้ลงนาม: ${data.signerName || '-'} (${data.signerPosition || '-'})
- วันที่: ${data.date || '-'}

เอกสาร PDF ถูกจัดเก็บในระบบ Google Drive ส่วนกลาง:
${pdfFile ? pdfFile.getUrl() : ROOT_FOLDER_ID}
${attachLinksText}

ขอแสดงความนับถือ
ระบบ Memo All In One
  `;

  const options = {
    name: data.company || 'Memo All In One'
  };

  if (pdfFile) {
    options.attachments = [pdfFile.getAs(MimeType.PDF)];
  }

  GmailApp.sendEmail(recipient, subject, body, options);
}

/**
 * Send custom email directly
 */
function sendCustomEmail(data) {
  GmailApp.sendEmail(data.to, data.subject, data.body, {
    name: data.company || 'Memo All In One'
  });
}
