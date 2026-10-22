/**
 * Memo All-in-One - Utility Functions
 * Date formatting, Thai Baht Text conversion, DOCX/PDF exporter, Google Drive sync
 */

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_NUMBERS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

const Utils = {
  /**
   * Convert Arabic digits to Thai digits
   */
  toThaiDigits(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[0-9]/g, digit => THAI_NUMBERS[parseInt(digit, 10)]);
  },

  /**
   * Format ISO date string into formal Thai date: "15 ตุลาคม 2569"
   */
  formatThaiDateFull(dateStr, useThaiDigits = false) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS_FULL[d.getMonth()];
    const year = d.getFullYear() + 543;
    const res = `${day} ${month} ${year}`;
    return useThaiDigits ? this.toThaiDigits(res) : res;
  },

  /**
   * Format short Thai date: "15 ต.ค. 2569"
   */
  formatThaiDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  },

  /**
   * Format number as currency: 38,500.00
   */
  formatMoney(num) {
    const val = parseFloat(num);
    if (isNaN(val)) return '0.00';
    return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  /**
   * Convert number to Thai Baht Text: 38500 -> "สามหมื่นแปดพันห้าร้อยบาทถ้วน"
   */
  thaiBahtText(number) {
    if (number === null || number === undefined || number === '') return '';
    let num = parseFloat(String(number).replace(/,/g, ''));
    if (isNaN(num)) return '';

    if (num === 0) return 'ศูนย์บาทถ้วน';

    const words = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    function readGroup(digits) {
      let text = '';
      const len = digits.length;
      for (let i = 0; i < len; i++) {
        const d = parseInt(digits[i], 10);
        const pos = len - i - 1;
        if (d !== 0) {
          if (pos === 0 && d === 1 && len > 1 && digits[len - 2] !== '0') {
            text += 'เอ็ด';
          } else if (pos === 1 && d === 2) {
            text += 'ยี่' + positions[pos];
          } else if (pos === 1 && d === 1) {
            text += positions[pos];
          } else {
            text += words[d] + positions[pos];
          }
        }
      }
      return text;
    }

    const isNegative = num < 0;
    num = Math.abs(num);

    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let result = '';

    // Handle large numbers with millions
    if (integerPart.length > 6) {
      const millions = integerPart.slice(0, -6);
      const remainder = integerPart.slice(-6);
      result = readGroup(millions) + 'ล้าน' + readGroup(remainder);
    } else {
      result = readGroup(integerPart);
    }

    if (result) {
      result += 'บาท';
    }

    // Decimal part (Satang)
    if (decimalPart === '00' || !decimalPart) {
      result += 'ถ้วน';
    } else {
      const satangVal = parseInt(decimalPart, 10);
      if (satangVal > 0) {
        result += readGroup(decimalPart) + 'สตางค์';
      } else {
        result += 'ถ้วน';
      }
    }

    return (isNegative ? 'ลบ' : '') + result;
  },

  /**
   * Generate standardized corporate export file name:
   * Format: "[COMPANY_PREFIX] [SUBJECT]+[DATE].[ext]"
   * Company Prefix:
   *   - ไทยวัฒนาพานิช (twp) -> TWP
   *   - ล๊อกแมท (logmat) -> LMI
   *   - เหนือน้ำปทุม (nueanam) -> NNAP
   * Example: "TWP ขออนุมัติ AI+2026-10-22.pdf" or "TWP ขออนุมัติ AI+2026-10-22.doc"
   */
  generateDocFileName(doc, comp = null, extension = 'pdf', separator = '+') {
    if (!doc) return `document.${extension || 'pdf'}`;
    const resolvedComp = comp || (window.storage && doc.companyId ? window.storage.getCompany(doc.companyId) : null) || {};

    // 1. Company Code Prefix: TWP | LMI | NNAP
    let prefix = 'TWP';
    const compId = (doc.companyId || resolvedComp.id || '').toLowerCase();
    const compCode = (resolvedComp.code || '').toUpperCase();
    const compName = (doc.customCompanyName || resolvedComp.name || '').trim();

    if (compId === 'twp' || compCode === 'TWP' || compName.includes('ไทยวัฒนา')) {
      prefix = 'TWP';
    } else if (compId === 'logmat' || compCode === 'LMI' || compName.includes('ล๊อกแมท')) {
      prefix = 'LMI';
    } else if (compId === 'nueanam' || compCode === 'NNAP' || compCode === 'NNA' || compName.includes('เหนือน้ำ')) {
      prefix = 'NNAP';
    } else if (compCode) {
      prefix = compCode;
    } else if (compName) {
      prefix = compName.replace(/[/\\?%*:|"<>]/g, '').trim().substring(0, 8);
    }

    // 2. Subject
    let subject = (doc.subject || '').trim();
    if (!subject) {
      const typeNames = {
        'memo': 'บันทึกภายใน',
        'announcement': 'ประกาศ',
        'salary_cert': 'หนังสือรับรองเงินเดือน',
        'work_cert': 'หนังสือรับรองการทำงาน'
      };
      subject = typeNames[doc.docType] || doc.headerTitle || 'บันทึกข้อความ';
    }
    // Remove invalid filename characters in Windows: \ / : * ? " < > |
    const sanitizedSubject = subject.replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, ' ').trim();

    // 3. Document Date
    const docDate = (doc.date || new Date().toISOString().split('T')[0]).trim();

    // 4. Combine: e.g. "TWP ขออนุมัติ AI+2026-10-22.pdf"
    const sep = separator !== undefined ? separator : '+';
    const baseName = `${prefix} ${sanitizedSubject}${sep}${docDate}`;
    if (!extension) return baseName;
    const cleanExt = extension.replace(/^\./, '');
    return `${baseName}.${cleanExt}`;
  },

  /**
   * Build clean, standard MSO Word HTML document layout
   * Strictly respects A4 margins, Thai corporate typography (TH Sarabun New 16pt),
   * table-based alignments, and constrains logos to 65px so MS Word never stretches them.
   */
  buildWordHtml(doc, comp = null) {
    if (!doc) return '';
    const resolvedComp = comp || (window.storage ? window.storage.getCompany(doc.companyId) : null) || {};
    const compName = doc.customCompanyName || resolvedComp.name || 'บริษัท ทิปปิ้งพอยท์ มีเดีย จำกัด';
    const compLogo = doc.customLogo || resolvedComp.logo || '';
    const compTaxId = (doc.customTaxId !== undefined && doc.customTaxId !== '') ? doc.customTaxId : (resolvedComp.taxId || '');
    const compTel = (doc.customTel !== undefined && doc.customTel !== '') ? doc.customTel : (resolvedComp.tel || '');
    const compAddress = (doc.customAddress !== undefined && doc.customAddress !== '') ? doc.customAddress : (resolvedComp.address || '');

    const docType = doc.docType || 'memo';
    const docDate = doc.date || new Date().toISOString().split('T')[0];
    const thaiDate = this.formatThaiDateFull(docDate);
    const displayDocNo = doc.docNumber || '';
    const subject = doc.subject || '';
    const recipient = doc.toRecipient || '';
    const department = doc.department || '';
    const closing = doc.closing || 'จึงเรียนมาเพื่อโปรดทราบ';
    const signerName = doc.signerName || '';
    const signerPos = doc.signerPosition || '';
    const headerTitle = doc.headerTitle || (docType === 'memo' ? 'บันทึก' : '');
    const signatureImg = doc.signatureImg || '';

    // Clean and sanitize paragraph content for Word
    let formattedContent = doc.content || '';
    if (formattedContent && !formattedContent.includes('<p')) {
      formattedContent = `<p style="text-indent: 2.5cm; margin: 0 0 8pt 0; text-align: justify; line-height: 1.35; font-size: 16pt;">${formattedContent}</p>`;
    } else if (formattedContent) {
      formattedContent = formattedContent.replace(/<p\b([^>]*)>/gi, '<p style="text-indent: 2.5cm; margin: 0 0 8pt 0; text-align: justify; line-height: 1.35; font-size: 16pt;" $1>');
    }

    // Explicitly constrained logo image for MS Word
    const logoImgHtml = compLogo
      ? `<img src="${compLogo}" width="65" height="65" border="0" style="width:65px; height:65px; max-width:65px; max-height:65px; object-fit:contain; display:block;" alt="Logo" />`
      : '';

    // Signature visual
    const signatureVisualHtml = signatureImg
      ? `<img src="${signatureImg}" width="160" height="50" border="0" style="width:160px; height:50px; max-height:50px; object-fit:contain; margin-bottom:4pt;" alt="ลายเซ็น" /><br>`
      : `<div style="font-family:'Cordia New',sans-serif; letter-spacing:3px; color:#555555; margin-bottom:8pt;">...................................................</div>`;

    // Shared Footer Table
    const footerTableHtml = `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30pt; border-top: 1pt solid #cbd5e1; padding-top: 6pt; border-collapse: collapse;">
        <tr>
          <td style="font-family:'TH Sarabun New','Sarabun','Cordia New',sans-serif; font-size: 10pt; color: #475569; line-height: 1.35;">
            <b style="color: #0f172a;">${compName}</b>${department ? ' | หน่วยงาน: ' + department : ''}${compTel ? ' | โทรศัพท์: ' + compTel : ''}<br>
            ${compTaxId ? 'เลขประจำตัวผู้เสียภาษี: ' + compTaxId + '<br>' : ''}
            ${compAddress ? compAddress : ''}
          </td>
        </tr>
      </table>
    `;

    let bodyHtml = '';

    if (docType === 'memo') {
      bodyHtml = `
        <!-- Top Header: Logo + Company Name side by side -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8pt; border-collapse: collapse;">
          <tr>
            <td width="75" valign="middle" style="width: 75px;">
              ${logoImgHtml}
            </td>
            <td valign="middle" style="padding-left: 10pt;">
              <span style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 18pt; font-weight: bold; color: #000000;">${compName}</span>
            </td>
          </tr>
        </table>

        <!-- Center Document Title -->
        <div style="text-align: center; margin: 10pt 0 6pt 0;">
          <span style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 24pt; font-weight: bold; color: #000000;">${headerTitle || 'บันทึก'}</span>
        </div>

        <!-- Date Right Aligned -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10pt; border-collapse: collapse;">
          <tr>
            <td width="55%"></td>
            <td width="45%" align="right" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; color: #000000;">
              วันที่ ${thaiDate}
            </td>
          </tr>
        </table>

        <!-- Metadata Table: ที่, เรื่อง, เรียน -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 12pt; border-collapse: collapse;">
          ${(displayDocNo && displayDocNo !== '-' && !displayDocNo.includes('(รอออกเลขที่)')) ? `
          <tr>
            <td width="75" valign="top" style="width: 75px; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0;">ที่</td>
            <td valign="top" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0; color: #000000;">${displayDocNo}</td>
          </tr>` : ''}
          <tr>
            <td width="75" valign="top" style="width: 75px; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0;">เรื่อง</td>
            <td valign="top" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0; color: #000000;">${subject}</td>
          </tr>
          <tr>
            <td width="75" valign="top" style="width: 75px; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0;">เรียน</td>
            <td valign="top" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; padding: 2pt 0; color: #000000;">${recipient}</td>
          </tr>
        </table>

        <!-- Content Body -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; line-height: 1.35; margin: 10pt 0;">
          ${formattedContent}
        </div>

        <!-- Attachments List (if present) -->
        ${(doc.attachments && Array.isArray(doc.attachments) && doc.attachments.length > 0) ? `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 10pt 0; border-collapse: collapse;">
          <tr>
            <td style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 15pt; font-weight: bold; padding-bottom: 3pt;">สิ่งที่ส่งมาด้วย / เอกสารแนบ:</td>
          </tr>
          ${doc.attachments.map((a, i) => `
          <tr>
            <td style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 15pt; padding-left: 20pt; padding-bottom: 2pt;">
              ${i+1}. ${a.name} ${a.size ? '(' + this.formatFileSize(a.size) + ')' : ''}
            </td>
          </tr>`).join('')}
        </table>` : ''}

        <!-- Closing Statement -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; text-indent: 2.5cm; margin: 12pt 0;">
          ${closing}
        </div>

        <!-- Signature Block: Right Half Alignment via Table -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20pt; border-collapse: collapse;">
          <tr>
            <td width="50%"></td>
            <td width="50%" align="center" style="text-align: center; font-family:'TH Sarabun New','Sarabun',sans-serif;">
              ${signatureVisualHtml}
              <div style="font-size: 16pt; line-height: 1.25;">${signerName ? `(${signerName})` : ''}</div>
              <div style="font-size: 15pt; color: #333333; margin-top: 2pt; line-height: 1.25;">${signerPos}</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        ${footerTableHtml}
      `;
    } else if (docType === 'announcement') {
      bodyHtml = `
        <!-- Top Left: Logo + Company Name below -->
        <div style="margin-bottom: 12pt;">
          ${logoImgHtml}
          <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 18pt; font-weight: bold; margin-top: 6pt; color: #000000;">${compName}</div>
        </div>

        <!-- Center Document Title -->
        <div style="text-align: center; margin: 12pt 0;">
          <span style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 24pt; font-weight: bold; color: #000000;">${headerTitle || 'ประกาศ'}</span>
        </div>

        <!-- Metadata Table: เลขที่, เรื่อง -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14pt; border-collapse: collapse;">
          ${(displayDocNo && displayDocNo !== '-') ? `
          <tr>
            <td width="75" valign="top" style="width: 75px; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0;">เลขที่</td>
            <td valign="top" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0; color: #000000;">${displayDocNo}</td>
          </tr>` : ''}
          <tr>
            <td width="75" valign="top" style="width: 75px; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0;">เรื่อง</td>
            <td valign="top" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; font-weight: bold; padding: 2pt 0; color: #000000;">${subject}</td>
          </tr>
        </table>

        <!-- Content Body -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; line-height: 1.35; margin: 12pt 0;">
          ${formattedContent}
        </div>

        <!-- Closing Statement -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; text-indent: 2.5cm; margin: 14pt 0;">
          ${closing}
        </div>

        <!-- Center Date and Signature -->
        <div style="text-align: center; margin-top: 24pt;">
          <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; margin-bottom: 14pt;">
            ประกาศ ณ วันที่ ${thaiDate}
          </div>
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td width="25%"></td>
              <td width="50%" align="center" style="text-align: center; font-family:'TH Sarabun New','Sarabun',sans-serif;">
                ${signatureVisualHtml}
                <div style="font-size: 16pt; line-height: 1.25;">${signerName ? `(${signerName})` : ''}</div>
                <div style="font-size: 15pt; color: #333333; margin-top: 2pt; line-height: 1.25;">${signerPos}</div>
              </td>
              <td width="25%"></td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        ${footerTableHtml}
      `;
    } else if (docType === 'salary_cert' || docType === 'work_cert') {
      const empName = doc.employeeName || '...................................................';
      const empIdCard = doc.employeeIdCard || '...................................................';
      const empPos = doc.employeePosition || '...................................................';
      const thaiStartDate = this.formatThaiDateFull(doc.startDate);
      const isSalary = docType === 'salary_cert';
      const certTitle = isSalary ? 'หนังสือรับรองเงินเดือน' : 'หนังสือรับรองการทำงาน';
      const salaryFormatted = this.formatMoney(doc.salaryAmount || 0);
      const salaryText = doc.salaryText || this.thaiBahtText(doc.salaryAmount || 0);
      const purpose = doc.certPurpose || (isSalary ? 'เพื่อใช้เป็นหลักฐานประกอบการทำธุรกรรม' : 'เพื่อใช้เป็นหลักฐานประกอบการสมัครงาน / ยื่นขอเอกสาร');

      bodyHtml = `
        <!-- Top Corporate Letterhead Bar -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-bottom: 2pt solid #0f172a; padding-bottom: 8pt; margin-bottom: 14pt; border-collapse: collapse;">
          <tr>
            <td width="75" valign="middle" style="width: 75px;">
              ${logoImgHtml}
            </td>
            <td valign="middle" style="padding-left: 10pt;">
              <span style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 18pt; font-weight: bold; color: #000000;">${compName}</span>
            </td>
            <td valign="middle" align="right" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 12pt; color: #64748b;">
              เอกสารสำคัญทางการ
            </td>
          </tr>
        </table>

        <!-- Center Document Title -->
        <div style="text-align: center; margin: 12pt 0 16pt 0;">
          <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 22pt; font-weight: bold; color: #000000;">${certTitle}</div>
          <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 14pt; color: #475569; margin-top: 2pt;">เลขที่: <b style="color:#000;">${displayDocNo}</b></div>
        </div>

        <!-- Recipient & Date Table -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 14pt; border-collapse: collapse;">
          <tr>
            <td width="60%" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt;"><b style="color:#000;">เรียน:</b> ${recipient}</td>
            <td width="40%" align="right" style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt;"><b style="color:#000;">วันที่:</b> ${thaiDate}</td>
          </tr>
        </table>

        <!-- Certificate Body -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; line-height: 1.4; margin: 14pt 0;">
          <p style="text-indent: 2.5cm; margin: 0 0 10pt 0; text-align: justify;">
            หนังสือฉบับนี้ออกให้เพื่อรับรองว่า <b>${empName}</b> เลขประจำตัวประชาชน <b>${empIdCard}</b> 
            เป็นพนักงานประจำของ <b>${compName}</b> จริง โดยเริ่มเข้าปฏิบัติงานตั้งแต่วันที่ <b>${thaiStartDate}</b> 
            ปัจจุบันดำรงตำแหน่ง <b>${empPos}</b>
          </p>
          ${isSalary ? `
          <p style="text-indent: 2.5cm; margin: 0 0 10pt 0; text-align: justify;">
            และได้รับเงินเดือนในอัตราเดือนละ <b>${salaryFormatted} บาท</b> (<b>${salaryText}</b>) 
            โดยมิได้รวมค่าล่วงเวลาและสวัสดิการอื่นๆ ของบริษัทฯ
          </p>` : ''}
          <p style="text-indent: 2.5cm; margin: 0 0 10pt 0; text-align: justify;">
            หนังสือรับรองฉบับนี้ออกให้ ${purpose}
          </p>
        </div>

        <!-- Closing Statement -->
        <div style="font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 16pt; text-indent: 2.5cm; margin: 14pt 0;">
          ${closing}
        </div>

        <!-- Stamp box and Signature Table -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30pt; border-collapse: collapse;">
          <tr>
            <td width="40%" align="center" valign="middle">
              <div style="width: 110px; height: 110px; border: 1pt dashed #94a3b8; border-radius: 50%; font-family:'TH Sarabun New','Sarabun',sans-serif; font-size: 11pt; color: #94a3b8; text-align: center; padding-top: 32px; box-sizing: border-box;">
                ประทับตรานิติบุคคล<br>(ถ้ามี)
              </div>
            </td>
            <td width="60%" align="center" valign="middle" style="font-family:'TH Sarabun New','Sarabun',sans-serif;">
              ${signatureVisualHtml}
              <div style="font-size: 16pt; line-height: 1.25;">${signerName ? `(${signerName})` : ''}</div>
              <div style="font-size: 15pt; color: #333333; margin-top: 2pt; line-height: 1.25;">${signerPos}</div>
              <div style="font-size: 14pt; color: #64748b; margin-top: 1pt; line-height: 1.25;">${compName}</div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        ${footerTableHtml}
      `;
    }

    // Complete MSO Word Document Wrapper
    return `
      <html xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${displayDocNo || subject || 'Document'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm; /* A4 */
            margin: 2.0cm 2.0cm 2.0cm 2.5cm; /* Top 2.0cm, Right 2.0cm, Bottom 2.0cm, Left 2.5cm */
            mso-page-orientation: portrait;
          }
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 2.0cm 2.0cm 2.0cm 2.5cm;
            mso-header-margin: 1.0cm;
            mso-footer-margin: 1.0cm;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: 'TH Sarabun New', 'TH SarabunPSK', 'Sarabun', 'Cordia New', sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000000;
            background-color: #ffffff;
          }
          p, div, td {
            font-family: 'TH Sarabun New', 'TH SarabunPSK', 'Sarabun', 'Cordia New', sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000000;
          }
          p {
            margin: 0 0 6pt 0;
            text-align: justify;
            text-indent: 2.5cm;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          td {
            vertical-align: top;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${bodyHtml}
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Export document directly as Microsoft Word (.doc) with strict corporate formatting & constrained logo
   */
  exportToWord(docOrElement, filename = null, companyOverride = null) {
    let htmlContent = '';
    let targetDoc = null;

    // If passed a document data object
    if (docOrElement && typeof docOrElement === 'object' && !(docOrElement instanceof HTMLElement)) {
      targetDoc = docOrElement;
      htmlContent = this.buildWordHtml(docOrElement, companyOverride);
    } else {
      // If passed element or string ID
      let el = typeof docOrElement === 'string' ? document.getElementById(docOrElement) : docOrElement;
      
      // Try to get structured doc from active state first for highest fidelity
      let liveDoc = null;
      if (window.app && window.app.gatherFormData) {
        liveDoc = window.app.gatherFormData(false);
        if (window.app.currentEditingDocId && window.storage) {
          const existing = window.storage.getDocument(window.app.currentEditingDocId);
          if (existing && existing.docNumber) liveDoc.docNumber = existing.docNumber;
        }
      }

      if (liveDoc && liveDoc.subject) {
        targetDoc = liveDoc;
        htmlContent = this.buildWordHtml(liveDoc, companyOverride);
      } else if (el) {
        targetDoc = liveDoc;
        // Fallback: clone element and sanitize images to 65px
        const clone = el.cloneNode(true);
        clone.querySelectorAll('img').forEach(img => {
          img.setAttribute('width', '65');
          img.setAttribute('height', '65');
          img.style.width = '65px';
          img.style.height = '65px';
          img.style.maxWidth = '65px';
          img.style.maxHeight = '65px';
          img.style.objectFit = 'contain';
        });

        htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                xmlns:w='urn:schemas-microsoft-com:office:word' 
                xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>${filename || 'document'}</title>
            <style>
              @page { size: 210mm 297mm; margin: 20mm 20mm 20mm 25mm; }
              body { font-family: 'TH Sarabun New', 'Sarabun', sans-serif; font-size: 16pt; line-height: 1.35; color: #000; }
              p { margin: 0 0 6pt 0; text-align: justify; text-indent: 2.5cm; }
            </style>
          </head>
          <body>${clone.innerHTML}</body>
          </html>
        `;
      } else {
        alert('ไม่พบเอกสารที่จะส่งออกเป็น Word');
        return;
      }
    }

    const resolvedComp = companyOverride || (window.storage && targetDoc ? window.storage.getCompany(targetDoc.companyId) : null);
    const finalFilename = (filename && filename !== 'document.doc')
      ? (filename.endsWith('.doc') ? filename : `${filename}.doc`)
      : this.generateDocFileName(targetDoc, resolvedComp, 'doc');

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.app && window.app.showToast) {
      window.app.showToast(`ส่งออกไฟล์ Word "${finalFilename}" เรียบร้อยแล้ว`, 'success');
    }
  },

  /**
   * Dedicated Isolated Iframe Print Engine:
   * Completely bypasses modal overflow, backdrop filters, and screen layouts.
   * Direct native printing / "Save as PDF" with 100% crisp vector typography and exact A4 margins.
   */
  printDocument(docOrElement, companyOverride = null) {
    let resolvedDoc = null;
    if (docOrElement && typeof docOrElement === 'object' && !(docOrElement instanceof HTMLElement)) {
      resolvedDoc = docOrElement;
    } else if (window.app && window.app.gatherFormData) {
      resolvedDoc = window.app.gatherFormData(false);
      if (window.app.currentEditingDocId && window.storage) {
        const existing = window.storage.getDocument(window.app.currentEditingDocId);
        if (existing && existing.docNumber) resolvedDoc.docNumber = existing.docNumber;
      }
    }

    const resolvedComp = companyOverride || (window.storage && resolvedDoc ? window.storage.getCompany(resolvedDoc.companyId) : null);
    const docHtml = (window.app && resolvedDoc) 
      ? window.app.buildDocHtml(resolvedDoc) 
      : (document.getElementById('pdf-modal-sheet-wrapper')?.innerHTML || document.getElementById('a4-print-target')?.innerHTML || '');

    if (!docHtml || !docHtml.trim()) {
      alert('ไม่พบข้อมูลเอกสารสำหรับพิมพ์');
      return;
    }

    // Set page title to standard corporate filename: e.g. "TWP ขออนุมัติ AI+2026-10-22"
    // This title is what Chrome & Edge suggest by default when user selects "Save as PDF"!
    const fileTitle = this.generateDocFileName(resolvedDoc, resolvedComp, '');

    // Remove existing print iframe if any
    let oldIframe = document.getElementById('memo-print-iframe');
    if (oldIframe) oldIframe.remove();

    // Create fresh invisible iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'memo-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${fileTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
        \x3Cscript src="https://cdn.tailwindcss.com">\x3C/script>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: 'TH Sarabun New', 'Sarabun', 'Cordia New', sans-serif;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            max-height: 297mm;
            padding: 20mm 20mm 15mm 25mm;
            margin: 0 auto;
            background: #ffffff;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            .a4-page {
              width: 210mm !important;
              min-height: 297mm !important;
              height: 297mm !important;
              padding: 20mm 20mm 15mm 25mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
          ${docHtml}
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Give iframe short moment to load CSS & fonts then invoke print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
      }
    }, 450);
  },

  /**
   * Standalone New Tab Document Viewer:
   * Opens the A4 document in a dedicated browser tab with a top action bar (Print / PDF / Close).
   */
  openPrintPreviewTab(docOrElement, companyOverride = null) {
    let resolvedDoc = null;
    if (docOrElement && typeof docOrElement === 'object' && !(docOrElement instanceof HTMLElement)) {
      resolvedDoc = docOrElement;
    } else if (window.app && window.app.gatherFormData) {
      resolvedDoc = window.app.gatherFormData(false);
      if (window.app.currentEditingDocId && window.storage) {
        const existing = window.storage.getDocument(window.app.currentEditingDocId);
        if (existing && existing.docNumber) resolvedDoc.docNumber = existing.docNumber;
      }
    }

    const resolvedComp = companyOverride || (window.storage && resolvedDoc ? window.storage.getCompany(resolvedDoc.companyId) : null);
    const docHtml = (window.app && resolvedDoc)
      ? window.app.buildDocHtml(resolvedDoc)
      : (document.getElementById('pdf-modal-sheet-wrapper')?.innerHTML || document.getElementById('a4-print-target')?.innerHTML || '');

    if (!docHtml || !docHtml.trim()) {
      alert('ไม่พบเนื้อหาเอกสารสำหรับเปิดดู');
      return;
    }

    const fileTitle = this.generateDocFileName(resolvedDoc, resolvedComp, '');
    const printTab = window.open('', '_blank');
    if (!printTab) {
      alert('เบราว์เซอร์บล็อกหน้าต่างใหม่ (Pop-up Blocked)\nกรุณากดอนุญาตให้เปิด Pop-up บนเว็บไซต์นี้');
      return;
    }

    printTab.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>${fileTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
        \x3Cscript src="https://cdn.tailwindcss.com">\x3C/script>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #334155;
            font-family: 'Prompt', 'Sarabun', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .top-bar {
            position: sticky;
            top: 0;
            width: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #ffffff;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }
          .sheet-container {
            padding: 30px 16px 60px 16px;
          }
          .a4-sheet {
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            max-height: 297mm;
            background: #ffffff;
            padding: 20mm 20mm 15mm 25mm;
            box-shadow: 0 20px 45px rgba(0,0,0,0.35);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            font-family: 'TH Sarabun New', 'Sarabun', 'Cordia New', sans-serif;
          }
          @media print {
            .top-bar {
              display: none !important;
            }
            body {
              background: #ffffff !important;
              padding: 0 !important;
            }
            .sheet-container {
              padding: 0 !important;
            }
            .a4-sheet {
              width: 210mm !important;
              height: 297mm !important;
              padding: 20mm 20mm 15mm 25mm !important;
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-weight:700;font-size:15px;color:#38bdf8;">Memo All In One</span>
            <span style="color:#94a3b8;font-size:13px;">| ตัวอย่างก่อนพิมพ์ A4: ${fileTitle}</span>
          </div>
          <div style="display:flex;gap:10px;">
            <button onclick="window.print()" style="padding:8px 18px;background:#059669;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;">
              🖨️ สั่งพิมพ์ / บันทึก PDF
            </button>
            <button onclick="window.close()" style="padding:8px 14px;background:#475569;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;">
              ❌ ปิดแท็บ
            </button>
          </div>
        </div>
        <div class="sheet-container">
          <div class="a4-sheet">
            ${docHtml}
          </div>
        </div>
      </body>
      </html>
    `);
    printTab.document.close();
  },

  /**
   * Export document directly as PDF using html2pdf.js or fallback to iframe printing
   */
  exportToPdf(elementOrId, filename = null, docOverride = null, companyOverride = null) {
    let sourceEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!sourceEl) {
      alert('ไม่พบเนื้อหาเอกสารที่จะสร้าง PDF');
      return Promise.reject(new Error('Element not found'));
    }

    const resolvedDoc = docOverride || (window.app && window.app.gatherFormData ? window.app.gatherFormData(false) : null);
    const resolvedComp = companyOverride || (window.storage && resolvedDoc ? window.storage.getCompany(resolvedDoc.companyId) : null);
    const finalFilename = (filename && filename !== 'document.pdf')
      ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
      : this.generateDocFileName(resolvedDoc, resolvedComp, 'pdf');

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    // 1. Loading Overlay for smooth user feedback
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'pdf-export-loading-overlay';
    loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.7);backdrop-filter:blur(4px);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#ffffff;font-family:Prompt,Sarabun,sans-serif;';
    loadingOverlay.innerHTML = `
      <div style="background:#ffffff;color:#0f172a;padding:28px 36px;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);text-align:center;max-width:420px;width:90%;">
        <div style="display:inline-block;width:44px;height:44px;border:4px solid #e2e8f0;border-top-color:#0284c7;border-radius:50%;animation:pdfspin 0.8s linear infinite;margin-bottom:16px;"></div>
        <style>@keyframes pdfspin{to{transform:rotate(360deg);}}</style>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:6px;color:#0f172a;">กำลังสร้างเอกสาร PDF</h3>
        <p style="font-size:13px;color:#64748b;margin:0;">ระบบกำลังจัดหน้า A4 และแปลงเนื้อหาเอกสาร (${finalFilename}) กรุณารอสักครู่...</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);

    // 2. Visible unscaled in-flow export container behind the overlay
    const sourceHeight = sourceEl.scrollHeight || 1115;
    const isSinglePage = sourceHeight <= 1200;
    const renderHeight = isSinglePage ? 1115 : sourceHeight;

    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-pdf-render-wrapper';
    exportContainer.style.cssText = `position:absolute;left:0;top:0;width:794px;height:${renderHeight}px;background:#ffffff;z-index:999990;overflow:hidden;box-sizing:border-box;pointer-events:none;`;

    const clone = sourceEl.cloneNode(true);
    clone.id = 'export-pdf-sheet-clone';
    clone.style.transform = 'none';
    clone.style.webkitTransform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    clone.style.width = '794px';
    clone.style.height = `${renderHeight}px`;
    clone.style.maxHeight = `${renderHeight}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';
    clone.style.display = 'flex';
    clone.style.flexDirection = 'column';
    clone.style.justifyContent = 'space-between';
    clone.style.overflow = 'hidden';

    clone.querySelectorAll('img').forEach(img => {
      img.crossOrigin = 'anonymous';
    });

    exportContainer.appendChild(clone);
    document.body.appendChild(exportContainer);

    const cleanup = () => {
      if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
      if (exportContainer && exportContainer.parentNode) {
        exportContainer.parentNode.removeChild(exportContainer);
      }
      document.body.style.cursor = originalCursor;
    };

    if (window.html2pdf) {
      const opt = {
        margin: [0, 0, 0, 0],
        filename: finalFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          width: 794,
          height: renderHeight,
          windowWidth: 794,
          windowHeight: renderHeight,
          allowTaint: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      return window.html2pdf().set(opt).from(clone).save().then(() => {
        cleanup();
        if (window.app && window.app.showToast) {
          window.app.showToast(`บันทึกไฟล์ PDF "${finalFilename}" เรียบร้อยแล้ว`, 'success');
        }
      }).catch(err => {
        console.warn('html2pdf direct render error, falling back to iframe print:', err);
        cleanup();
        this.printDocument(docOverride || sourceEl, companyOverride);
      });
    } else {
      cleanup();
      this.printDocument(docOverride || sourceEl, companyOverride);
      return Promise.resolve();
    }
  },

  /**
   * Format file size in human readable format (KB, MB)
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Compress an image file using HTML5 Canvas to drastically reduce storage footprint
   */
  compressImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.70) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('ไม่ใช่ไฟล์รูปภาพ'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Always output JPEG or WebP for optimal compression
          const outputType = 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);
          
          // Calculate approx size in bytes from base64
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const compressedBytes = Math.round((base64Length * 3) / 4);

          resolve({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            name: file.name.replace(/\.[^/.]+$/, "") + '.jpg',
            type: outputType,
            originalSize: file.size,
            size: compressedBytes,
            compressedSize: compressedBytes,
            isCompressed: true,
            dataUrl: dataUrl
          });
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดภาพเพื่อบีบอัดได้'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Process attachment file (auto compress image, or read dataUrl with size check)
   */
  async processAttachmentFile(file) {
    if (file.type.startsWith('image/')) {
      return await this.compressImageFile(file);
    }

    // For non-image files (PDF, DOC, TXT)
    const MAX_NON_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for local storage
    if (file.size > MAX_NON_IMAGE_SIZE) {
      throw new Error(`ไฟล์ "${file.name}" มีขนาด ${this.formatFileSize(file.size)} ซึ่งเกิน 2 MB แนะนำให้อัปโหลดไฟล์ขนาดใหญ่ไว้บน Google Drive โดยตรง`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          name: file.name,
          type: file.type || 'application/octet-stream',
          originalSize: file.size,
          size: file.size,
          compressedSize: file.size,
          isCompressed: false,
          dataUrl: e.target.result
        });
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Sync document payload & attachments to Google Apps Script (Sheet Log & Drive)
   */
  async syncToGoogleDrive(doc, company, settings) {
    if (!settings.webhookUrl) {
      // Fallback: Open Google Drive Folder directly
      const openDrive = confirm(
        'ยังไม่ได้ระบุ Google Apps Script Webhook URL ในหน้าตั้งค่า (Settings)\n\nคุณต้องการเปิด Google Drive Folder ปลายทางเพื่ออัปโหลดไฟล์ด้วยตนเองหรือไม่?\n' +
        settings.driveUrl
      );
      if (openDrive) {
        window.open(settings.driveUrl, '_blank');
      }
      return { success: false, manual: true };
    }

    try {
      // Prepare attachments metadata & base64
      const attachmentsPayload = (doc.attachments || []).map(att => ({
        name: att.name,
        type: att.type,
        size: att.size,
        dataUrl: att.dataUrl
      }));

      const standardFileName = this.generateDocFileName(doc, company, 'pdf');

      const payload = {
        action: 'log_document',
        fileName: standardFileName,
        folderId: settings.driveFolderId,
        company: company.name,
        companyCode: company.code,
        docNumber: doc.docNumber,
        docType: doc.docType,
        headerTitle: doc.headerTitle || '',
        subject: doc.subject,
        toRecipient: doc.toRecipient || '',
        signerName: doc.signerName || '',
        signerPosition: doc.signerPosition || '',
        department: doc.department || '',
        date: doc.date,
        status: doc.status || 'published',
        attachments: attachmentsPayload,
        attachmentsCount: attachmentsPayload.length,
        attachmentsNames: attachmentsPayload.map(a => a.name).join(', '),
        htmlContent: document.getElementById('a4-print-target')?.innerHTML || '',
        timestamp: new Date().toISOString()
      };

      const res = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Allows Google Apps Script Web App endpoints
      });

      return { success: true };
    } catch (e) {
      console.error('Google Sheet / Drive Sync error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Helper to compose email with mailto link
   */
  composeEmail(toEmail, subject, body) {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:${toEmail || ''}?subject=${encodedSubject}&body=${encodedBody}`;
  }
};

window.Utils = Utils;

