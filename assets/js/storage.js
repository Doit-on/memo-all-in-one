/**
 * Memo All-in-One - Data Storage & Master Data Layer
 */

const STORAGE_KEYS = {
  COMPANIES: 'memo_companies_v1',
  RECIPIENTS: 'memo_recipients_v1',
  POSITIONS: 'memo_positions_v1',
  CLOSINGS: 'memo_closings_v1',
  SUBJECTS: 'memo_subjects_v1',
  DOCUMENTS: 'memo_documents_v1',
  RUNNING_LOGS: 'memo_running_logs_v1',
  RUNNING_COUNTERS: 'memo_counters_v1',
  SETTINGS: 'memo_settings_v1',
  ACTIVE_COMPANY: 'memo_active_company_v1',
  TEMPLATES: 'memo_templates_v1',
  AUTOSAVE_DRAFT: 'memo_autosave_draft_v1'
};

// Initial Company Master Data
const DEFAULT_COMPANIES = [
  {
    id: 'twp',
    code: 'TWP',
    prefix: 'ทวพ',
    name: 'สำนักพิมพ์ ไทยวัฒนาพานิช จำกัด',
    enName: 'Thai Watana Panich Co., Ltd.',
    taxId: '0105501000781',
    address: '891 ถนนพระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ 10330',
    tel: '0-2215-0630',
    logo: (window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.twp) || 'assets/images/twp_logo.png'
  },
  {
    id: 'logmat',
    code: 'LMI',
    prefix: 'LMI',
    name: 'บริษัท ล๊อกแมท อินทิเกรชั่น จำกัด',
    enName: 'Logmat Integration Co., Ltd.',
    taxId: '0135555005449',
    address: '92/9 ถนนรังสิต-บางพูน ตำบลบางพูน เขตเมืองปทุม ปทุมธานี 12000',
    tel: '081-581-5080',
    logo: (window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.logmat) || 'assets/images/logmat_logo.svg'
  },
  {
    id: 'nueanam',
    code: 'NNAP',
    prefix: 'NNAP',
    name: 'บริษัท เหนือน้ำแอร์ ปทุมธานี จำกัด',
    enName: 'Nueanam Air Pathumthani Co., Ltd.',
    taxId: '0135560000000',
    address: '99/9 หมู่ 2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    tel: '0-2902-8888',
    logo: (window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.nueanam) || 'assets/images/nueanam_logo.svg'
  }
];

// Master Dropdown Presets
const DEFAULT_RECIPIENTS = [
  'ผู้จัดการ',
  'กรรมการผู้จัดการ',
  'ผู้ถือหุ้น',
  'พนักงาน',
  'ผู้จัดการทั่วไป',
  'คณะกรรมการบริหาร',
  'พนักงานทุกท่าน'
];

const DEFAULT_POSITIONS = [
  'พนักงานบัญชี',
  'พนักงานธุรการคลัง',
  'พนักงานการเงิน',
  'พนักงานธุรการขาย',
  'ผู้จัดการทั่วไป',
  'ผู้จัดการส่วนบัญชีการเงิน',
  'ผู้จัดการส่วนงานขาย',
  'ผู้จัดการธุรการขาย',
  'ผู้จัดการธุรการ',
  'เลขานุการและจัดซื้อ',
  'ผู้จัดการขาย',
  'ผู้จัดการคลังสินค้าและจัดส่ง'
];

const DEFAULT_CLOSINGS = [
  'จึงเรียนมาเพื่อโปรดทราบ',
  'จึงเรียนมาเพื่อโปรดพิจารณา',
  'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ',
  'จึงเรียนมาเพื่อทราบและถือปฏิบัติต่อไป',
  'จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการต่อไป',
  'หวังเป็นอย่างยิ่งว่าจะได้รับการพิจารณาด้วยดี'
];

const DEFAULT_SUBJECTS = [
  'ขออนุมัติจัดซื้ออุปกรณ์สำนักงานและคอมพิวเตอร์',
  'แจ้งกำหนดการประชุมคณะกรรมการบริหารประจำเดือน',
  'ขออนุมัติเบิกจ่ายค่าเดินทางและเบี้ยเลี้ยงปฏิบัติงานนอกสถานที่',
  'ประกาศวันหยุดตามประเพณีประจำปี 2569',
  'ขออนุมัติปรับปรุงพื้นที่ปฏิบัติงานและระบบระบายอากาศ',
  'แจ้งแนวทางปฏิบัติการรักษาความปลอดภัยข้อมูลภายในองค์กร',
  'ขออนุมัติฝึกอบรมและพัฒนาทักษะบุคลากรประจำปี'
];

const DEFAULT_SETTINGS = {
  adminPin: 'memoadmin',
  driveUrl: 'https://drive.google.com/drive/u/0/folders/1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3',
  driveFolderId: '1bUQx-wtmx3iQFlV0Bknbwh45zPv35nR3',
  driveEmail: 'mayomco@gmail.com',
  webhookUrl: 'https://script.google.com/macros/s/AKfycbyBEoUBICy8Yh4vSaklQb6TbH-2gsyF8VFPml7NZHS1bLV7P8jNVGZ6w9v3g7fiU9v8/exec',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1JpBrTgqbM0VbRTVPbDFwkY2__W1AkLSxtljKJs_4Xl8/edit?gid=0#gid=0',
  sheetId: '1JpBrTgqbM0VbRTVPbDFwkY2__W1AkLSxtljKJs_4Xl8',
  yearFormat: 'BE', // 'BE' (พ.ศ.) or 'CE' (ค.ศ.)
  autoSyncDrive: true
};

// Initial Sample Documents to give a rich experience on first boot
const DEFAULT_SAMPLE_DOCUMENTS = [
  {
    id: 'doc-demo-1',
    docNumber: 'ทวพ. 001/2569',
    docType: 'memo',
    headerTitle: 'บันทึก',
    companyId: 'twp',
    date: '2026-07-06',
    toRecipient: 'กรรมการผู้จัดการ',
    subject: 'ขออนุมัติจัดอบรมเชิงวิชาการ',
    content: '<p>เพื่อให้แผนการตลาดได้รับต่อเนื่องและปรับแนวทางการรับรู้ของลูกค้ากลุ่มครูผู้สอน ในการใช้สื่อเพิ่มเติมและการเน้นทางวิชาการสำหรับครู จึงต้องขอจัดอบรม เชิงวิชาการ ในการใช้สื่อเพื่อนำมาเป็นงานวิจัยในชั้นเรียน ทั้งนี้จะให้เป็นการจัดโดย รศ. ดร.กิตติวรรณ สินธุนาวา และมีบริษัทฯเป็นผู้ให้การสนับสนุน เพราะเป็นงานด้านวิจัยในชั้นเรียน แต่บริษัทฯให้การสนับสนุน ค่าใช้จ่ายและสื่อเพื่อใช้ในการทำวิจัย โดยจัดในวันที่ 15 สิงหาคม โดยอาจารย์จะเป็นผู้ดำเนินการ ทั้งนี้จะเน้นไปที่การใช้สื่อ ที่บริษัทฯพัฒนาขึ้นไม่ว่าจะเป็น Youtube หรือ Kahoot เพื่อให้ครูที่สนใจสมัครเข้ามาได้ใช้สื่อและสร้างความเข้าใจในการนำไปทำวิจัยเพื่อเพิ่มโอกาสให้ตนเอง โดยพิจารณางบประมาณ ไม่เกิน 80,000 บาท ตามรายละเอียดแนบ ลูกค้าเป้าหมายคือ ลูกค้าที่ใช้ Get Involved และ ลูกค้าที่ใช้หนังสือเราทั้งหมด จำนวนการรับอบรม ไม่เกิน 20 คน เพื่อให้ได้ผลลัพธ์ที่ตั้งไว้ และ เป็นโมเดลสำหรับไปดำเนินการในโรงเรียน แทนการอบรมแบบเดิม ในปี 2569-2570 นี้ด้วย</p>',
    closing: 'จึงเรียนมาเพื่อขออนุมัติงบประมาณและการดำเนินการ',
    signerName: 'นิพนธ์ ศรแก้ว',
    signerPosition: 'รักษาการ ผจก.ส่วนงานขาย',
    signatureImg: '',
    department: 'ฝ่ายวิชาการและพัฒนาสื่อ',
    status: 'published',
    createdAt: '2026-07-06T09:30:00.000Z',
    updatedAt: '2026-07-06T09:30:00.000Z'
  },
  {
    id: 'doc-demo-2',
    docNumber: 'LMI/ประกาศ 002/2569',
    docType: 'announcement',
    headerTitle: 'ประกาศ',
    companyId: 'logmat',
    date: '2026-10-09',
    toRecipient: 'พนักงานทุกท่าน',
    subject: 'การใช้ระบบ Document Control (DC) และ Logistic Management (LM)',
    content: '<p>บริษัทฯได้ดำเนินการพัฒนาระบบปฏิบัติงานเพิ่มเติมเพื่อช่วยให้การปฏิบัติงานมีประสิทธิภาพ ลดความซ้ำซ้อน และสร้างมาตรฐานการทำงานให้ดีขึ้น ทั้งนี้ระบบกำลังอยู่ในขั้นทดลองการปฏิบัติงาน จะเริ่มใช้อย่างเป็นทางการ 1 พฤศจิกายน 2569 เป็นต้นไป จำเป็นที่พนักงานต้องร่วมทดสอบและใช้ระบบเพื่อให้เกิดประสิทธิภาพร่วมกัน</p>',
    closing: 'จึงเรียนมาเพื่อโปรดทราบ',
    signerName: 'นิพนธ์ ศรแก้ว',
    signerPosition: 'กรรมการผู้จัดการ',
    signatureImg: '',
    department: 'ฝ่ายบริหารและธุรการ',
    status: 'published',
    createdAt: '2026-10-09T11:00:00.000Z',
    updatedAt: '2026-10-09T11:00:00.000Z'
  },
  {
    id: 'doc-demo-3',
    docNumber: 'NNAP-SAL-2569/001',
    docType: 'salary_cert',
    companyId: 'nueanam',
    date: '2026-10-05',
    toRecipient: 'ผู้จัดการสาขา ธนาคารกสิกรไทย จำกัด (มหาชน)',
    subject: 'หนังสือรับรองเงินเดือน',
    employeeName: 'นายสมเกียรติ มั่นคง',
    employeeIdCard: '1-1002-00345-67-8',
    employeePosition: 'พนักงานธุรการขาย',
    startDate: '2022-05-01',
    salaryAmount: 38500,
    salaryText: 'สามหมื่นแปดพันห้าร้อยบาทถ้วน',
    certPurpose: 'เพื่อใช้ประกอบการยื่นขอสินเชื่อที่อยู่อาศัย',
    content: '',
    closing: 'จึงออกหนังสือรับรองฉบับนี้ไว้เพื่อเป็นหลักฐาน',
    signerName: 'นางสาวกานดา เพียรเจริญ',
    signerPosition: 'ผู้จัดการส่วนบัญชีการเงิน',
    signatureImg: '',
    department: 'ฝ่ายบัญชีและการเงิน',
    status: 'published',
    createdAt: '2026-10-05T14:15:00.000Z',
    updatedAt: '2026-10-05T14:15:00.000Z'
  }
];

// Master Ready-to-Use Templates
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-purchase',
    category: 'จัดซื้อ-จัดจ้าง',
    name: 'ขออนุมัติจัดซื้ออุปกรณ์ / ครุภัณฑ์ / บริการ',
    icon: '🛒',
    subject: 'ขออนุมัติจัดซื้ออุปกรณ์และครุภัณฑ์สำนักงาน',
    toRecipient: 'กรรมการผู้จัดการ',
    closing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ',
    content: `<p>ด้วยฝ่ายงานมีความประสงค์จะขออนุมัติจัดซื้ออุปกรณ์และครุภัณฑ์ เพื่อสนับสนุนการปฏิบัติงานให้มีประสิทธิภาพยิ่งขึ้นและรองรับการทำงานของพนักงาน โดยมีรายการและความจำเป็นดังต่อไปนี้</p>
<table style="width:100%; border-collapse:collapse; margin:15px 0;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:50px;">ลำดับ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">รายการ / รายละเอียด</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:80px;">จำนวน</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:100px;">ราคา/หน่วย</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:110px;">ราคารวม (บาท)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">อุปกรณ์คอมพิวเตอร์และอุปกรณ์ต่อพ่วงสำหรับการพัฒนาระบบ</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1 ชุด</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">25,000.00</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">25,000.00</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">2</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">โควต้าบริการ Cloud / Gemini AI Package ประจำเดือน</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1 สิทธิ์</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">3,500.00</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">3,500.00</td>
    </tr>
    <tr style="font-weight:bold; background:#f8fafc;">
      <td colspan="4" style="border:1px solid #cbd5e1; padding:8px; text-align:right;">รวมเป็นเงินทั้งสิ้น (รวมภาษีมูลค่าเพิ่ม)</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">28,500.00</td>
    </tr>
  </tbody>
</table>
<p>ทั้งนี้ การจัดซื้อดังกล่าวมีงบประมาณรองรับตามแผนงานประจำปีเรียบร้อยแล้ว รายละเอียดเอกสารใบเสนอราคาแนบมาพร้อมนี้</p>`
  },
  {
    id: 'tpl-project',
    category: 'โครงการและงบประมาณ',
    name: 'ขออนุมัติโครงการ / กิจกรรม / อบรมสัมมนา',
    icon: '📊',
    subject: 'ขออนุมัติจัดโครงการพัฒนาและฝึกอบรมเชิงปฏิบัติการ',
    toRecipient: 'กรรมการผู้จัดการ',
    closing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติงบประมาณและแผนการดำเนินงาน',
    content: `<p>ตามที่บริษัทฯ มีนโยบายส่งเสริมและยกระดับศักยภาพบุคลากรและพัฒนานวัตกรรมการทำงาน ฝ่ายงานจึงได้จัดทำโครงการอบรมเชิงปฏิบัติการขึ้น โดยมีรายละเอียดวัตถุประสงค์และแผนการดำเนินงานดังนี้</p>
<p><strong>1. วัตถุประสงค์:</strong> เพื่อเพิ่มทักษะความรู้ความเข้าใจในการประยุกต์ใช้เทคโนโลยีดิจิทัลและ AI ในกระบวนการทำงานให้รวดเร็วและมีประสิทธิภาพ</p>
<p><strong>2. กลุ่มเป้าหมาย:</strong> พนักงานและผู้เกี่ยวข้อง จำนวน 20 คน</p>
<p><strong>3. ระยะเวลาและสถานที่:</strong> วันที่ 15 สิงหาคม 2569 ณ ห้องประชุมใหญ่บริษัทฯ</p>
<p><strong>4. ประมาณการค่าใช้จ่าย:</strong></p>
<table style="width:100%; border-collapse:collapse; margin:15px 0;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:50px;">ลำดับ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">รายการค่าใช้จ่าย</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:120px;">จำนวนเงิน (บาท)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ค่าตอบแทนวิทยากรผู้เชี่ยวชาญ (6 ชั่วโมง)</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">30,000.00</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">2</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ค่าอาหารกลางวันและอาหารว่างผู้เข้าอบรม</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">15,000.00</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">3</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ค่าเอกสารและสื่ออุปกรณ์การเรียนรู้ E-Learning</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">12,000.00</td>
    </tr>
    <tr style="font-weight:bold; background:#f8fafc;">
      <td colspan="2" style="border:1px solid #cbd5e1; padding:8px; text-align:right;">รวมงบประมาณทั้งสิ้น</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">57,000.00</td>
    </tr>
  </tbody>
</table>
<p><strong>5. ประโยชน์ที่คาดว่าจะได้รับ:</strong> พนักงานสามารถนำเครื่องมือดิจิทัลไปประยุกต์ใช้ลดขั้นตอนการทำงานได้จริง และสร้างโมเดลการอบรมสำหรับต่อยอดแก่ลูกค้าภายนอก</p>`
  },
  {
    id: 'tpl-travel',
    category: 'เบิกจ่ายและสวัสดิการ',
    name: 'ขออนุมัติเดินทางปฏิบัติงานนอกสถานที่ / เบิกเบี้ยเลี้ยง',
    icon: '🚗',
    subject: 'ขออนุมัติเดินทางไปปฏิบัติงานและเบิกจ่ายค่าใช้จ่ายในการเดินทาง',
    toRecipient: 'ผู้จัดการทั่วไป',
    closing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ',
    content: `<p>เนื่องด้วยฝ่ายงานมีความจำเป็นต้องเดินทางไปปฏิบัติงานตรวจเช็คหน้างานและประสานงานกับลูกค้าภายนอกสถานที่ จึงขออนุมัติการเดินทางและเบิกจ่ายค่าใช้จ่ายตามระเบียบบริษัทฯ ดังนี้</p>
<p><strong>1. บุคลากรผู้เดินทาง:</strong> นายสมเกียรติ มั่นคง และทีมงานรวม 3 คน</p>
<p><strong>2. สถานที่และภารกิจ:</strong> เยี่ยมชมและประสานงานติดตั้งระบบ ณ หน่วยงานลูกค้า จ.ปทุมธานี</p>
<p><strong>3. วันเวลาเดินทาง:</strong> วันที่ 10 พฤศจิกายน 2569 เวลา 08:30 - 17:30 น.</p>
<p><strong>4. ประมาณการค่าใช้จ่าย:</strong></p>
<table style="width:100%; border-collapse:collapse; margin:15px 0;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:50px;">ลำดับ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">รายการ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:120px;">จำนวนเงิน (บาท)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ค่าน้ำมันเชื้อเพลิงและค่าทางด่วน (ตามใบเสร็จจริง)</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">1,800.00</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">2</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ค่าเบี้ยเลี้ยงปฏิบัติงานนอกสถานที่ (3 คน x 300 บาท)</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">900.00</td>
    </tr>
    <tr style="font-weight:bold; background:#f8fafc;">
      <td colspan="2" style="border:1px solid #cbd5e1; padding:8px; text-align:right;">รวมเป็นเงินทั้งสิ้น</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">2,700.00</td>
    </tr>
  </tbody>
</table>`
  },
  {
    id: 'tpl-meeting',
    category: 'การประชุม',
    name: 'ระเบียบวาระการประชุม / บันทึกการประชุม',
    icon: '📝',
    subject: 'แจ้งระเบียบวาระการประชุมคณะกรรมการบริหาร ประจำเดือน',
    toRecipient: 'คณะกรรมการบริหารและผู้เกี่ยวข้องทุกท่าน',
    closing: 'จึงเรียนมาเพื่อโปรดทราบและเข้าร่วมการประชุมตามกำหนดเวลา',
    content: `<p>บริษัทฯ ขอเรียนเชิญเข้าร่วมการประชุมคณะกรรมการบริหารประจำเดือน เพื่อติดตามความคืบหน้าการดำเนินงานและพิจารณาประเด็นสำคัญขององค์กร โดยมีรายละเอียดดังต่อไปนี้</p>
<p><strong>วัน/เวลา:</strong> วันศุกร์ที่ 28 พฤศจิกายน 2569 เวลา 13:30 - 16:30 น.<br>
<strong>สถานที่:</strong> ห้องประชุม 1 อาคารสำนักงานใหญ่ (หรือผ่านระบบ Zoom Meeting)</p>
<p><strong>ระเบียบวาระการประชุม:</strong></p>
<p><strong>วาระที่ 1:</strong> เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ<br>
<strong>วาระที่ 2:</strong> รับรองรายงานการประชุมครั้งที่ผ่านมา<br>
<strong>วาระที่ 3:</strong> เรื่องสืบเนื่องจากการประชุมครั้งก่อน<br>
&nbsp;&nbsp;3.1 ความคืบหน้าระบบ Memo All-in-One และ Google Sheet Integration<br>
&nbsp;&nbsp;3.2 การย้ายระบบ Cloud และควบคุมโควต้า AI<br>
<strong>วาระที่ 4:</strong> เรื่องเพื่อพิจารณา<br>
&nbsp;&nbsp;4.1 แผนงบประมาณและเป้าหมายประจำไตรมาสถัดไป<br>
<strong>วาระที่ 5:</strong> เรื่องอื่นๆ (ถ้ามี)</p>`
  },
  {
    id: 'tpl-announcement',
    category: 'ประกาศและนโยบาย',
    name: 'ประกาศระเบียบและแนวทางปฏิบัติภายในองค์กร',
    icon: '📢',
    subject: 'แนวทางการรักษาความปลอดภัยข้อมูลและการใช้งานระบบสารสนเทศ',
    toRecipient: 'พนักงานทุกท่าน',
    closing: 'จึงประกาศมาเพื่อทราบและถือปฏิบัติอย่างเคร่งครัดตั้งแต่บัดนี้เป็นต้นไป',
    content: `<p>เพื่อให้การดำเนินงานด้านสารสนเทศและการรักษาความปลอดภัยของข้อมูลภายในองค์กรเป็นไปด้วยความเรียบร้อย มีมาตรฐาน และป้องกันความเสียหายที่อาจเกิดขึ้น บริษัทฯ จึงกำหนดแนวทางปฏิบัติให้พนักงานทุกคนถือปฏิบัติดังนี้</p>
<ol style="margin-left: 20px; line-height: 1.8;">
  <li>ห้ามเผยแพร่หรือส่งต่อเอกสารสำคัญ ข้อมูลลูกค้า หรือรหัสผ่านของระบบงานแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต</li>
  <li>การเข้าถึงเอกสารและฐานข้อมูลผ่าน Google Drive และ Google Sheets ต้องกระทำผ่านบัญชีอีเมลทางการของบริษัทฯ เท่านั้น</li>
  <li>กำหนดให้เปลี่ยนรหัสผ่านระบบงานทุกๆ 90 วัน และตั้งรหัสผ่านที่มีความยาวไม่น้อยกว่า 8 ตัวอักษร</li>
  <li>หากพบความผิดปกติหรือมีข้อสงสัยเกี่ยวกับระบบ ขอให้แจ้งฝ่ายไอทีและธุรการโดยทันที</li>
</ol>`
  },
  {
    id: 'tpl-report',
    category: 'รายงานการปฏิบัติงาน',
    name: 'รายงานผลการปฏิบัติงาน / ความคืบหน้าประจำเดือน',
    icon: '📈',
    subject: 'รายงานผลการดำเนินงานและความคืบหน้าโครงการประจำเดือน',
    toRecipient: 'ผู้จัดการทั่วไป',
    closing: 'จึงเรียนมาเพื่อโปรดทราบผลการดำเนินงาน',
    content: `<p>ฝ่ายงานขอสรุปรายงานผลการปฏิบัติงานและความคืบหน้าของโครงการสำคัญ ประจำเดือนที่ผ่านมา โดยมีรายละเอียดผลลัพธ์การทำงานดังนี้</p>
<table style="width:100%; border-collapse:collapse; margin:15px 0;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:50px;">ลำดับ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">ภารกิจ / โครงการ</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:120px;">เป้าหมาย</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:120px;">ผลการดำเนินงาน</th>
      <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:90px;">สถานะ</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">ปรับปรุงระบบบันทึกข้อความ Memo All-in-One</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">100%</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">100%</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; color:#16a34a; font-weight:bold;">เรียบร้อย</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">2</td>
      <td style="border:1px solid #cbd5e1; padding:8px;">เชื่อมต่อฐานข้อมูล Google Sheets & Google Drive</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">100%</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">100%</td>
      <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; color:#16a34a; font-weight:bold;">เรียบร้อย</td>
    </tr>
  </tbody>
</table>
<p><strong>ปัญหาและอุปสรรค:</strong> -</p>
<p><strong>แผนการดำเนินงานในเดือนถัดไป:</strong> ติดตามการใช้งานของพนักงานและพัฒนาฟีเจอร์เพิ่มเติมตามข้อเสนอแนะ</p>`
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(DEFAULT_COMPANIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECIPIENTS)) {
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(DEFAULT_RECIPIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(DEFAULT_POSITIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLOSINGS)) {
      localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(DEFAULT_CLOSINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, 'twp');
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(DEFAULT_SAMPLE_DOCUMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RUNNING_LOGS)) {
      // Seed initial running logs matching demo docs
      const sampleLogs = [
        {
          id: 'log-1',
          docId: 'doc-demo-1',
          companyId: 'twp',
          docType: 'memo',
          docNumber: 'ทวพ. 001/2569',
          previousNumber: '-',
          nextNumber: 'ทวพ. 002/2569',
          subject: 'ขออนุมัติจัดซื้ออุปกรณ์สำนักงานและคอมพิวเตอร์',
          issuedBy: 'นางสาววิภาดา รักษ์ดี',
          timestamp: '2026-10-01T09:30:00.000Z'
        },
        {
          id: 'log-2',
          docId: 'doc-demo-2',
          companyId: 'logmat',
          docType: 'announcement',
          docNumber: 'LMI/ประกาศ 001/2569',
          previousNumber: '-',
          nextNumber: 'LMI/ประกาศ 002/2569',
          subject: 'ประกาศแนวทางการทำงานแบบผสมผสาน (Hybrid Work)',
          issuedBy: 'นายธนาธิป เจริญทรัพย์',
          timestamp: '2026-10-03T11:00:00.000Z'
        },
        {
          id: 'log-3',
          docId: 'doc-demo-3',
          companyId: 'nueanam',
          docType: 'salary_cert',
          docNumber: 'NNA-SAL-2569/001',
          previousNumber: '-',
          nextNumber: 'NNA-SAL-2569/002',
          subject: 'หนังสือรับรองเงินเดือน - นายสมเกียรติ มั่นคง',
          issuedBy: 'นางสาวกานดา เพียรเจริญ',
          timestamp: '2026-10-05T14:15:00.000Z'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.RUNNING_LOGS, JSON.stringify(sampleLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RUNNING_COUNTERS)) {
      const counters = {
        twp: { memo: 1, announcement: 0, salary_cert: 0, work_cert: 0 },
        logmat: { memo: 0, announcement: 1, salary_cert: 0, work_cert: 0 },
        nueanam: { memo: 0, announcement: 0, salary_cert: 1, work_cert: 0 }
      };
      localStorage.setItem(STORAGE_KEYS.RUNNING_COUNTERS, JSON.stringify(counters));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }
  }

  // Generic Get & Set
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Failed to read from localStorage (${key}):`, e);
      return null;
    }
  }

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error(`Failed to save to localStorage (${key}):`, e);
      return false;
    }
  }

  // Companies
  getCompanies() {
    let list = this.get(STORAGE_KEYS.COMPANIES);
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = DEFAULT_COMPANIES;
    } else {
      let updated = false;
      list = list.map(c => {
        let modified = false;
        let newComp = { ...c };
        // Migrate Nueanam code to NNAP
        if (newComp.id === 'nueanam' && (newComp.code === 'NNA' || !newComp.code)) {
          newComp.code = 'NNAP';
          newComp.prefix = 'NNAP';
          modified = true;
        }
        // Migrate legacy relative image paths to Base64 so file:/// canvas never taints
        if (newComp.logo && newComp.logo.startsWith('assets/images/') && window.DEFAULT_LOGOS && window.DEFAULT_LOGOS[newComp.id]) {
          newComp.logo = window.DEFAULT_LOGOS[newComp.id];
          modified = true;
        }
        if (modified) updated = true;
        return newComp;
      });
      if (updated) {
        this.set(STORAGE_KEYS.COMPANIES, list);
      }
    }
    return list;
  }

  getCompany(id) {
    const defaultTwLogo = (window.DEFAULT_LOGOS && window.DEFAULT_LOGOS.twp) || 'assets/images/twp_logo.png';
    if (id === 'all') {
      return {
        id: 'all',
        name: 'รวมทุกบริษัท (ทุกหน่วยงาน)',
        enName: 'All Companies Group',
        code: 'ALL',
        prefix: 'ALL',
        taxId: '',
        address: '',
        tel: '',
        logo: defaultTwLogo
      };
    }
    const list = this.getCompanies();
    let comp = list.find(c => c.id === id) || list[0];
    if (comp && comp.logo && comp.logo.startsWith('assets/images/') && window.DEFAULT_LOGOS && window.DEFAULT_LOGOS[comp.id]) {
      comp = { ...comp, logo: window.DEFAULT_LOGOS[comp.id] };
    }
    return comp;
  }

  saveCompany(company) {
    const list = this.getCompanies();
    const idx = list.findIndex(c => c.id === company.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...company };
    } else {
      list.push(company);
    }
    this.set(STORAGE_KEYS.COMPANIES, list);
    return list;
  }

  deleteCompany(id) {
    let list = this.getCompanies();
    if (list.length <= 1) {
      throw new Error('ไม่สามารถลบบริษัทสุดท้ายได้');
    }
    list = list.filter(c => c.id !== id);
    this.set(STORAGE_KEYS.COMPANIES, list);
    return list;
  }

  // Active Company
  getActiveCompanyId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY) || 'twp';
  }

  setActiveCompanyId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, id);
  }

  // Presets
  getRecipients() {
    return this.get(STORAGE_KEYS.RECIPIENTS) || DEFAULT_RECIPIENTS;
  }

  addRecipient(name) {
    if (!name || !name.trim()) return;
    const list = this.getRecipients();
    if (!list.includes(name.trim())) {
      list.unshift(name.trim());
      this.set(STORAGE_KEYS.RECIPIENTS, list);
    }
  }

  getPositions() {
    return this.get(STORAGE_KEYS.POSITIONS) || DEFAULT_POSITIONS;
  }

  addPosition(name) {
    if (!name || !name.trim()) return;
    const list = this.getPositions();
    if (!list.includes(name.trim())) {
      list.push(name.trim());
      this.set(STORAGE_KEYS.POSITIONS, list);
    }
  }

  getClosings() {
    return this.get(STORAGE_KEYS.CLOSINGS) || DEFAULT_CLOSINGS;
  }

  addClosing(phrase) {
    if (!phrase || !phrase.trim()) return;
    const list = this.getClosings();
    if (!list.includes(phrase.trim())) {
      list.push(phrase.trim());
      this.set(STORAGE_KEYS.CLOSINGS, list);
    }
  }

  getSubjects() {
    return this.get(STORAGE_KEYS.SUBJECTS) || DEFAULT_SUBJECTS;
  }

  addSubject(subj) {
    if (!subj || !subj.trim()) return;
    const list = this.getSubjects();
    if (!list.includes(subj.trim())) {
      list.unshift(subj.trim()); // Put recent at top
      if (list.length > 50) list.pop(); // keep top 50
      this.set(STORAGE_KEYS.SUBJECTS, list);
    }
  }

  // Documents
  getDocuments() {
    return this.get(STORAGE_KEYS.DOCUMENTS) || [];
  }

  getDocument(id) {
    const list = this.getDocuments();
    return list.find(d => d.id === id);
  }

  saveDocument(doc) {
    const list = this.getDocuments();
    const idx = list.findIndex(d => d.id === doc.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      doc.updatedAt = now;
      list[idx] = { ...list[idx], ...doc };
    } else {
      doc.id = doc.id || 'doc-' + Date.now();
      doc.createdAt = now;
      doc.updatedAt = now;
      list.unshift(doc);
    }

    this.set(STORAGE_KEYS.DOCUMENTS, list);

    // Also remember the subject for autocomplete suggestions
    if (doc.subject) {
      this.addSubject(doc.subject);
    }
    // Remember custom recipient or position
    if (doc.toRecipient) {
      this.addRecipient(doc.toRecipient);
    }
    if (doc.signerPosition) {
      this.addPosition(doc.signerPosition);
    }

    return doc;
  }

  deleteDocument(id) {
    let list = this.getDocuments();
    const targetDoc = list.find(d => d.id === id);
    list = list.filter(d => d.id !== id);
    this.set(STORAGE_KEYS.DOCUMENTS, list);

    // Also remove any running log referencing this document
    if (targetDoc) {
      let logs = this.getRunningLogs();
      const initialLen = logs.length;
      logs = logs.filter(l => l.docId !== id && (!targetDoc.docNumber || l.docNumber !== targetDoc.docNumber));
      if (logs.length !== initialLen) {
        this.set(STORAGE_KEYS.RUNNING_LOGS, logs);
      }
    }

    // Auto-heal sequence counters so deleted number is instantly freed up
    this.syncCountersWithExistingDocs();
    return list;
  }

  // =========================================================================
  // Running Number Sequences, Sequence Gap Auto-Healing & Audit Logs
  // =========================================================================
  getRunningCounters() {
    return this.get(STORAGE_KEYS.RUNNING_COUNTERS) || {};
  }

  /**
   * Format document number string according to company and document type
   */
  formatDocNumber(companyId, docType, seqNumber, yearBE = null) {
    const company = this.getCompany(companyId);
    const currentYearBE = yearBE || (new Date().getFullYear() + 543);
    const seqPadded = String(seqNumber).padStart(3, '0');

    if (docType === 'memo') {
      return `${company.prefix}. ${seqPadded}/${currentYearBE}`;
    } else if (docType === 'announcement') {
      return `${company.prefix}/ประกาศ ${seqPadded}/${currentYearBE}`;
    } else if (docType === 'salary_cert') {
      return `${company.code}-SAL-${currentYearBE}/${seqPadded}`;
    } else if (docType === 'work_cert') {
      return `${company.code}-EMP-${currentYearBE}/${seqPadded}`;
    }
    return `${company.code}-${seqPadded}/${currentYearBE}`;
  }

  /**
   * Extract integer sequence number from formatted document number
   */
  extractSeqFromDocNumber(docNumber) {
    if (!docNumber || typeof docNumber !== 'string') return null;
    // Format: "ทวพ. 001/2569" or "ทวพ/ประกาศ 001/2569"
    const m1 = docNumber.match(/(\d{3,4})\/\d{4}/);
    if (m1) return parseInt(m1[1], 10);
    // Format: "TWP-SAL-2569/001"
    const m2 = docNumber.match(/\/\s*(\d{3,4})/);
    if (m2) return parseInt(m2[1], 10);
    // Fallback: first 3+ digit number
    const m3 = docNumber.match(/(\d{3,4})/);
    if (m3) return parseInt(m3[1], 10);
    const m4 = docNumber.match(/(\d+)/);
    if (m4) return parseInt(m4[1], 10);
    return null;
  }

  /**
   * Check if a document number is already taken by another active document or log
   */
  isDocNumberAvailable(docNumber, excludeDocId = null) {
    if (!docNumber || !docNumber.trim()) return { available: false, message: 'กรุณาระบุเลขที่เอกสาร' };
    const cleanNo = docNumber.trim();
    const docs = this.getDocuments();
    const conflict = docs.find(d => d.docNumber && d.docNumber.trim() === cleanNo && d.id !== excludeDocId);
    if (conflict) {
      return {
        available: false,
        conflictDoc: conflict,
        message: `เลขที่ "${cleanNo}" มีอยู่ในระบบแล้ว (เรื่อง: ${conflict.subject || 'ไม่มีชื่อเรื่อง'})`
      };
    }

    const logs = this.getRunningLogs();
    const conflictLog = logs.find(l => l.docNumber && l.docNumber.trim() === cleanNo && l.docId !== excludeDocId);
    if (conflictLog) {
      return {
        available: false,
        conflictDoc: conflictLog,
        message: `เลขที่ "${cleanNo}" มีอยู่ในทะเบียนคุมแล้ว (เรื่อง: ${conflictLog.subject || 'ไม่มีชื่อเรื่อง'})`
      };
    }

    return { available: true };
  }

  /**
   * Smart Sequence Gap Finding:
   * Scans active documents and active audit logs to find the lowest available sequence number (>= 1).
   * If doc 001 was deleted, 001 becomes available again!
   * If doc 002 was deleted but 001 and 003 exist, 002 is returned to fill the gap so numbers never skip!
   */
  getNextAvailableSequence(companyId, docType, yearBE = null) {
    const docs = this.getDocuments();
    const logs = this.getRunningLogs();
    const usedSeqSet = new Set();

    // Collect from active documents
    docs.forEach(d => {
      if (d.companyId === companyId && d.docType === docType && d.docNumber && !d.docNumber.includes('(ฉบับร่าง)')) {
        const seq = this.extractSeqFromDocNumber(d.docNumber);
        if (seq !== null && seq > 0) {
          usedSeqSet.add(seq);
        }
      }
    });

    // Collect from active audit logs
    logs.forEach(l => {
      if (l.companyId === companyId && l.docType === docType && l.docNumber) {
        const seq = this.extractSeqFromDocNumber(l.docNumber);
        if (seq !== null && seq > 0) {
          usedSeqSet.add(seq);
        }
      }
    });

    // Find lowest missing integer starting from 1 (001)
    let nextSeq = 1;
    while (usedSeqSet.has(nextSeq)) {
      nextSeq++;
    }
    return nextSeq;
  }

  /**
   * Peek next number that will be issued (reflecting sequence gap recovery)
   */
  peekNextNumber(companyId, docType) {
    const nextSeq = this.getNextAvailableSequence(companyId, docType);
    return this.formatDocNumber(companyId, docType, nextSeq);
  }

  /**
   * Issue running number with optional custom sequence / custom number override
   */
  issueRunningNumber(companyId, docType, docId, subject, signerName, customSeq = null, customDocNo = null) {
    const company = this.getCompany(companyId);
    const currentYearBE = new Date().getFullYear() + 543;

    let targetSeq = null;
    let issuedNumber = '';

    if (customDocNo && customDocNo.trim()) {
      issuedNumber = customDocNo.trim();
      targetSeq = this.extractSeqFromDocNumber(issuedNumber) || 1;
    } else if (customSeq !== null && customSeq !== undefined && parseInt(customSeq, 10) > 0) {
      targetSeq = parseInt(customSeq, 10);
      issuedNumber = this.formatDocNumber(companyId, docType, targetSeq, currentYearBE);
    } else {
      targetSeq = this.getNextAvailableSequence(companyId, docType, currentYearBE);
      issuedNumber = this.formatDocNumber(companyId, docType, targetSeq, currentYearBE);
    }

    // Update running counter if needed
    const counters = this.getRunningCounters();
    if (!counters[companyId]) counters[companyId] = {};
    const curCount = counters[companyId][docType] || 0;
    if (targetSeq > curCount) {
      counters[companyId][docType] = targetSeq;
      this.set(STORAGE_KEYS.RUNNING_COUNTERS, counters);
    }

    const previousNumber = targetSeq > 1 ? this.formatDocNumber(companyId, docType, targetSeq - 1, currentYearBE) : '-';
    const nextNumber = this.formatDocNumber(companyId, docType, targetSeq + 1, currentYearBE);

    // Add to audit logs
    const logs = this.getRunningLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      docId: docId || '',
      companyId: companyId,
      docType: docType,
      docNumber: issuedNumber,
      previousNumber: previousNumber,
      nextNumber: nextNumber,
      subject: subject || 'ไม่ระบุชื่อเรื่อง',
      issuedBy: signerName || 'ไม่ระบุผู้ลงนาม',
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.set(STORAGE_KEYS.RUNNING_LOGS, logs);

    return {
      issuedNumber,
      previousNumber,
      nextNumber,
      log: newLog
    };
  }

  /**
   * Update or modify document number of an existing document
   */
  updateDocumentNumber(docId, newDocNumber) {
    const doc = this.getDocument(docId);
    if (!doc) return { success: false, message: 'ไม่พบเอกสารที่จะแก้ไขเลขที่' };

    const check = this.isDocNumberAvailable(newDocNumber, docId);
    if (!check.available) {
      return { success: false, message: check.message };
    }

    const oldDocNumber = doc.docNumber;
    doc.docNumber = newDocNumber.trim();
    doc.updatedAt = new Date().toISOString();
    this.saveDocument(doc);

    // Update audit log
    let logs = this.getRunningLogs();
    const matchedLog = logs.find(l => l.docId === docId || (l.docNumber && l.docNumber === oldDocNumber));
    if (matchedLog) {
      matchedLog.docNumber = doc.docNumber;
      matchedLog.docId = docId;
      this.set(STORAGE_KEYS.RUNNING_LOGS, logs);
    } else {
      const newLog = {
        id: 'log-' + Date.now(),
        docId: docId,
        companyId: doc.companyId,
        docType: doc.docType,
        docNumber: doc.docNumber,
        previousNumber: oldDocNumber || '-',
        nextNumber: '-',
        subject: doc.subject || 'ไม่ระบุชื่อเรื่อง',
        issuedBy: doc.signerName || 'ไม่ระบุผู้ลงนาม',
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      this.set(STORAGE_KEYS.RUNNING_LOGS, logs);
    }

    this.syncCountersWithExistingDocs();
    return { success: true, doc };
  }

  /**
   * Synchronize counters with existing documents to maintain unbroken sequences
   */
  syncCountersWithExistingDocs() {
    const docs = this.getDocuments();
    const logs = this.getRunningLogs();
    const counters = this.getRunningCounters();
    const companies = this.getCompanies();
    const docTypes = ['memo', 'announcement', 'salary_cert', 'work_cert'];

    companies.forEach(c => {
      if (!counters[c.id]) counters[c.id] = {};
      docTypes.forEach(dt => {
        let maxSeq = 0;
        docs.forEach(d => {
          if (d.companyId === c.id && d.docType === dt && d.docNumber && !d.docNumber.includes('(ฉบับร่าง)')) {
            const seq = this.extractSeqFromDocNumber(d.docNumber);
            if (seq && seq > maxSeq) maxSeq = seq;
          }
        });
        logs.forEach(l => {
          if (l.companyId === c.id && l.docType === dt && l.docNumber) {
            const seq = this.extractSeqFromDocNumber(l.docNumber);
            if (seq && seq > maxSeq) maxSeq = seq;
          }
        });
        counters[c.id][dt] = maxSeq;
      });
    });

    this.set(STORAGE_KEYS.RUNNING_COUNTERS, counters);
    return counters;
  }

  getRunningLogs() {
    return this.get(STORAGE_KEYS.RUNNING_LOGS) || [];
  }

  deleteRunningLog(logId, alsoDeleteDoc = true) {
    let logs = this.getRunningLogs();
    const targetLog = logs.find(l => l.id === logId);
    if (!targetLog) return false;

    logs = logs.filter(l => l.id !== logId);
    this.set(STORAGE_KEYS.RUNNING_LOGS, logs);

    // If there's an associated document, remove it as well
    if (alsoDeleteDoc) {
      let docs = this.getDocuments();
      if (targetLog.docId) {
        docs = docs.filter(d => d.id !== targetLog.docId);
      }
      if (targetLog.docNumber) {
        docs = docs.filter(d => d.docNumber !== targetLog.docNumber);
      }
      this.set(STORAGE_KEYS.DOCUMENTS, docs);
    }

    this.syncCountersWithExistingDocs();
    return true;
  }

  // Settings
  getSettings() {
    const saved = this.get(STORAGE_KEYS.SETTINGS) || {};
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    // Auto-populate default URLs if empty in existing local storage
    if (!merged.webhookUrl || merged.webhookUrl.trim() === '') {
      merged.webhookUrl = DEFAULT_SETTINGS.webhookUrl;
    }
    if (!merged.sheetUrl || merged.sheetUrl.trim() === '') {
      merged.sheetUrl = DEFAULT_SETTINGS.sheetUrl;
    }
    if (!merged.sheetId || merged.sheetId.trim() === '') {
      merged.sheetId = DEFAULT_SETTINGS.sheetId;
    }
    return merged;
  }

  saveSettings(settings) {
    this.set(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...settings });
  }

  verifyAdminPin(pin) {
    const settings = this.getSettings();
    return pin === settings.adminPin;
  }

  // Ready-to-Use Templates
  getTemplates() {
    const tpls = this.get(STORAGE_KEYS.TEMPLATES);
    if (!tpls || !Array.isArray(tpls) || tpls.length === 0) {
      return DEFAULT_TEMPLATES;
    }
    return tpls;
  }

  getTemplate(id) {
    const list = this.getTemplates();
    return list.find(t => t.id === id) || null;
  }

  saveTemplate(tpl) {
    const list = this.getTemplates();
    const existingIdx = list.findIndex(t => t.id === tpl.id);
    if (existingIdx >= 0) {
      list[existingIdx] = tpl;
    } else {
      list.unshift(tpl);
    }
    this.set(STORAGE_KEYS.TEMPLATES, list);
    return tpl;
  }

  deleteTemplate(id) {
    let list = this.getTemplates();
    list = list.filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, list);
    return true;
  }

  // Autosave Draft
  getAutosaveDraft() {
    return this.get(STORAGE_KEYS.AUTOSAVE_DRAFT);
  }

  setAutosaveDraft(data) {
    return this.set(STORAGE_KEYS.AUTOSAVE_DRAFT, {
      ...data,
      savedAt: new Date().toISOString()
    });
  }

  clearAutosaveDraft() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTOSAVE_DRAFT);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Global Singleton Instance
window.storage = new StorageManager();
