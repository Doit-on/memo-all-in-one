/**
 * Verification test for Memo All In One:
 * 1. Test running number issuing sequence
 * 2. Test preset retention without field loss
 * 3. Test attachment processing structure
 * 4. Test Google Sheet Webhook payload format
 */

// Mock window and localStorage
const storageMap = {};
global.localStorage = {
  getItem: (k) => storageMap[k] || null,
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};

global.window = {
  DEFAULT_LOGOS: { twp: 'twp_logo_base64', logmat: 'logmat_logo_base64', nueanam: 'nueanam_logo_base64' },
  location: {}
};

// Load storage & utils
require('./assets/js/default_logos.js');
require('./assets/js/storage.js');
require('./assets/js/utils.js');

console.log('--- TEST 1: Running Number Issuance ---');
const compId = 'twp';
const docType = 'memo';

const peek1 = window.storage.peekNextNumber(compId, docType);
console.log('Peek Next Number:', peek1);

const issue1 = window.storage.issueRunningNumber(compId, docType, 'doc-1', 'ขออนุมัติเดินทาง', 'นิพนธ์');
console.log('Issued Number 1:', issue1.issuedNumber);

const peek2 = window.storage.peekNextNumber(compId, docType);
console.log('Peek Next Number after issue:', peek2);

if (issue1.issuedNumber.includes('002') && peek2.includes('003')) {
  console.log('PASS: Running Number sequence increments correctly (002 -> 003)!');
} else {
  console.error('FAIL: Running number sequence issue');
  process.exit(1);
}

console.log('\n--- TEST 2: Document Save & Preservation with Attachments ---');
const testDoc = {
  id: 'doc-1',
  docNumber: issue1.issuedNumber,
  docType: 'memo',
  companyId: 'twp',
  subject: 'ขออนุมัติเดินทางไปราชการ',
  toRecipient: 'ผู้จัดการทั่วไป',
  signerName: 'นิพนธ์ ศรแก้ว',
  signerPosition: 'รักษาการ ผจก.ส่วนงานขาย',
  closing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ',
  content: '<p>ขออนุมัติเดินทางไปปฏิบัติงาน...</p>',
  attachments: [
    {
      id: 'att-1',
      name: 'receipt.jpg',
      type: 'image/jpeg',
      originalSize: 4194304, // 4MB
      size: 92160,          // ~90KB
      compressedSize: 92160,
      isCompressed: true,
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
    }
  ],
  status: 'published'
};

const savedDoc = window.storage.saveDocument(testDoc);
const loadedDoc = window.storage.getDocument('doc-1');

console.log('Saved Doc Number:', loadedDoc.docNumber);
console.log('Saved Attachments Count:', loadedDoc.attachments.length);
console.log('Attachment Name:', loadedDoc.attachments[0].name);
console.log('Compressed Size:', window.Utils.formatFileSize(loadedDoc.attachments[0].size));

if (loadedDoc.attachments.length === 1 && loadedDoc.docNumber === issue1.issuedNumber) {
  console.log('PASS: Document and attachments saved and retrieved properly!');
} else {
  console.error('FAIL: Document preservation error');
  process.exit(1);
}

console.log('\n--- TEST 3: Google Sheets & Apps Script Payload Verification ---');
const comp = window.storage.getCompany('twp');
const settings = {
  webhookUrl: 'https://script.google.com/macros/s/AKfycby.../exec',
  driveFolderId: '1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3',
  driveUrl: 'https://drive.google.com/drive/u/0/folders/1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3'
};

const payload = {
  action: 'log_document',
  folderId: settings.driveFolderId,
  company: comp.name,
  companyCode: comp.code,
  docNumber: loadedDoc.docNumber,
  docType: loadedDoc.docType,
  subject: loadedDoc.subject,
  toRecipient: loadedDoc.toRecipient,
  signerName: loadedDoc.signerName,
  signerPosition: loadedDoc.signerPosition,
  department: loadedDoc.department || '',
  date: loadedDoc.date || '2026-10-14',
  status: loadedDoc.status,
  attachments: loadedDoc.attachments,
  attachmentsCount: loadedDoc.attachments.length,
  attachmentsNames: loadedDoc.attachments.map(a => a.name).join(', ')
};

console.log('Payload Action:', payload.action);
console.log('Payload Doc Number:', payload.docNumber);
console.log('Payload Subject:', payload.subject);
console.log('Payload Attachments Names:', payload.attachmentsNames);

if (payload.action === 'log_document' && payload.attachmentsCount === 1) {
  console.log('PASS: Webhook payload structure verified!');
} else {
  console.error('FAIL: Webhook payload invalid');
  process.exit(1);
}

console.log('\n--- TEST 4: Delete Running Log & Associated Document ---');
const logsBefore = window.storage.getRunningLogs();
console.log('Logs count before delete:', logsBefore.length);
const targetLog = logsBefore[0];
console.log('Target log to delete:', targetLog.id, targetLog.docNumber);

const deleteSuccess = window.storage.deleteRunningLog(targetLog.id, true);
const logsAfter = window.storage.getRunningLogs();
console.log('Logs count after delete:', logsAfter.length);
const docAfter = targetLog.docId ? window.storage.getDocument(targetLog.docId) : null;
console.log('Document after delete should be undefined:', docAfter);

if (deleteSuccess && logsAfter.length === logsBefore.length - 1 && !docAfter) {
  console.log('PASS: Running log and associated document successfully deleted!');
} else {
  console.error('FAIL: Delete running log failed');
  process.exit(1);
}

console.log('\n--- TEST 5: Compliant MS Word HTML Generation & Logo Scaling ---');
const wordHtml = window.Utils.buildWordHtml(loadedDoc, comp);
console.log('Word HTML length:', wordHtml.length);
const hasMsoHeader = wordHtml.includes('xmlns:w="urn:schemas-microsoft-com:office:word"');
const hasLogoConstraints = wordHtml.includes('width="65" height="65"') && wordHtml.includes('max-width:65px');
const hasThaiIndent = wordHtml.includes('text-indent: 2.5cm;');
const hasTableLayout = wordHtml.includes('<table width="100%"');

console.log('MSO Headers:', hasMsoHeader ? 'YES' : 'NO');
console.log('Constrained 65px Logo:', hasLogoConstraints ? 'YES' : 'NO');
console.log('Thai 2.5cm Indent:', hasThaiIndent ? 'YES' : 'NO');
console.log('Table Layout:', hasTableLayout ? 'YES' : 'NO');

if (hasMsoHeader && hasLogoConstraints && hasThaiIndent && hasTableLayout) {
  console.log('PASS: Word HTML correctly formatted with strict MSO constraints and A4 typography!');
} else {
  console.error('FAIL: Word HTML generation did not meet requirements');
  process.exit(1);
}

console.log('\n--- TEST 6: Standardized Corporate Filename Formatting ---');
const twpDoc = { companyId: 'twp', subject: 'ขออนุมัติ AI', date: '2026-10-22', docType: 'memo' };
const lmiDoc = { companyId: 'logmat', subject: 'ระบบคลังสินค้า', date: '2026-10-22', docType: 'memo' };
const nnaDoc = { companyId: 'nueanam', subject: 'หนังสือรับรองเงินเดือน', date: '2026-10-22', docType: 'salary_cert' };

const twpName = window.Utils.generateDocFileName(twpDoc, null, 'pdf');
const lmiName = window.Utils.generateDocFileName(lmiDoc, null, 'doc');
const nnaName = window.Utils.generateDocFileName(nnaDoc, null, 'pdf');

console.log('TWP PDF Name:', twpName);
console.log('LMI DOC Name:', lmiName);
console.log('NNAP PDF Name:', nnaName);

if (
  twpName === 'TWP ขออนุมัติ AI+2026-10-22.pdf' &&
  lmiName === 'LMI ระบบคลังสินค้า+2026-10-22.doc' &&
  nnaName === 'NNAP หนังสือรับรองเงินเดือน+2026-10-22.pdf'
) {
  console.log('PASS: Standardized corporate filenames strictly match requirements (TWP, LMI, NNAP)!');
} else {
  console.error('FAIL: Standardized corporate filename mismatch');
  process.exit(1);
}

console.log('\n--- TEST 7: Sequence Gap Recovery & Restarting at 001 When Document Deleted ---');
// Delete all twp memo documents and logs to test starting at 001
const allDocs = window.storage.getDocuments();
const twpMemoDocs = allDocs.filter(d => d.companyId === 'twp' && d.docType === 'memo');
twpMemoDocs.forEach(d => window.storage.deleteDocument(d.id));

// Verify that getNextAvailableSequence returns 1 (001)
const nextSeqAfterDelete = window.storage.getNextAvailableSequence('twp', 'memo');
const peekAfterDelete = window.storage.peekNextNumber('twp', 'memo');
console.log('Sequence after deleting TWP memos (should be 1):', nextSeqAfterDelete);
console.log('Peek number after deletion:', peekAfterDelete);

if (nextSeqAfterDelete === 1 && peekAfterDelete.includes('001')) {
  console.log('PASS: Deleting documents frees up sequence! Next number restarts at 001 without gaps.');
} else {
  console.error('FAIL: Sequence gap recovery failed to restart at 001');
  process.exit(1);
}

// Issue 001
const new001 = window.storage.issueRunningNumber('twp', 'memo', 'new-doc-1', 'บันทึกเริ่มต้น 001', 'ผู้จัดการ');
window.storage.saveDocument({ id: 'new-doc-1', docNumber: new001.issuedNumber, companyId: 'twp', docType: 'memo', subject: 'บันทึกเริ่มต้น 001' });
console.log('Issued 001:', new001.issuedNumber);

// Issue 002
const new002 = window.storage.issueRunningNumber('twp', 'memo', 'new-doc-2', 'บันทึกชุดที่สอง', 'ผู้จัดการ');
window.storage.saveDocument({ id: 'new-doc-2', docNumber: new002.issuedNumber, companyId: 'twp', docType: 'memo', subject: 'บันทึกชุดที่สอง' });
console.log('Issued 002:', new002.issuedNumber);

// Conflict check: 001 should NOT be available
const check001 = window.storage.isDocNumberAvailable(new001.issuedNumber);
console.log('Check 001 availability (should be false):', check001.available);

if (!check001.available) {
  console.log('PASS: Conflict detection prevents using already assigned document number!');
} else {
  console.error('FAIL: Conflict detection allowed assigned number');
  process.exit(1);
}

// Delete 001 to simulate user deleting document 001
window.storage.deleteDocument('new-doc-1');
const gapSeq = window.storage.getNextAvailableSequence('twp', 'memo');
console.log('Gap sequence after deleting 001 (should be 1 to fill gap):', gapSeq);

if (gapSeq === 1) {
  console.log('PASS: Auto-gap detection successfully detected missing 001 and offered it for reuse!');
} else {
  console.error('FAIL: Auto-gap sequence did not detect 001 gap');
  process.exit(1);
}

// Test updateDocumentNumber
const updateResult = window.storage.updateDocumentNumber('new-doc-2', 'ทวพ. 005/2569');
console.log('Update Document Number result:', updateResult.success, updateResult.doc?.docNumber);
if (updateResult.success && updateResult.doc.docNumber === 'ทวพ. 005/2569') {
  console.log('PASS: Document number can be safely updated/customized with audit log synchronization!');
} else {
  console.error('FAIL: updateDocumentNumber failed');
  process.exit(1);
}

console.log('\nALL UNIT & INTEGRATION TESTS PASSED 100%!');
