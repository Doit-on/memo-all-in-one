/**
 * Memo All-in-One - Main Application Controller
 */

class MemoApp {
  constructor() {
    this.currentView = 'landing';
    this.activeCompanyId = window.storage.getActiveCompanyId();
    this.currentEditingDocId = null;
    this.isSidebarCollapsed = false;
    this.isAdminAuthenticated = false;
    this.signatureDataUrl = '';
    this.customLogoDataUrl = '';
    this.modalCompanyLogoDataUrl = '';
    this.archiveCompanyFilter = this.activeCompanyId;
    this.runningLogsCompanyFilter = this.activeCompanyId;
    this.chartInstances = {};
    this.currentZoom = 1;
    this.isFitMode = true;
    this.isFormPanelCollapsed = false;

    // Lamp Login State
    this.isLampOn = false;
    this.selectedLoginRole = 'admin';
    this.isAuthenticated = localStorage.getItem('memo_authenticated') === 'true';

    // Document Workflow & Attachment States
    this.currentAttachments = [];
    this.currentIssuedDocNumber = null;

    this.init();
  }

  init() {
    this.initLampLogin();
    this.bindEvents();
    this.renderCompanySelector();
    this.renderPresets();
    this.setupSignaturePad();
    this.initRichEditor();
    this.initAutosave();
    
    // Default form values
    this.resetEditorForm();
    
    // Switch to initial view
    this.navigateTo('landing');

    // Auto-fit on window resize
    window.addEventListener('resize', () => {
      if (this.currentView === 'editor' && this.isFitMode) {
        this.autoFitPreview();
      }
    });
  }

  // =========================================================================
  // Lamp Login Animation & Gateway Methods
  // =========================================================================
  initLampLogin() {
    const stage = document.getElementById('lamp-login-stage');
    if (!stage) return;

    if (this.isAuthenticated) {
      stage.classList.add('stage-hidden');
    } else {
      stage.classList.remove('stage-hidden');
      stage.classList.remove('lamp-is-on');
      this.isLampOn = false;
    }
  }

  playSwitchSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch(e) {}
  }

  playSuccessChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
      });
    } catch(e) {}
  }

  toggleLampLight() {
    this.playSwitchSound();

    const stage = document.getElementById('lamp-login-stage');
    const pullCord = document.getElementById('lamp-pull-cord');
    const assembly = document.getElementById('lamp-assembly');
    const toggleText = document.getElementById('lamp-toggle-status-text');

    // Cord pull animation
    if (pullCord) {
      pullCord.classList.add('is-pulling');
      setTimeout(() => pullCord.classList.remove('is-pulling'), 220);
    }

    // Gentle pendulum swinging animation
    if (assembly) {
      assembly.classList.remove('swinging');
      void assembly.offsetWidth; // trigger reflow
      assembly.classList.add('swinging');
      setTimeout(() => assembly.classList.remove('swinging'), 1800);
    }

    this.isLampOn = !this.isLampOn;

    if (stage) {
      if (this.isLampOn) {
        stage.classList.add('lamp-is-on');
        if (toggleText) toggleText.textContent = 'ปิดไฟ';
        
        // Auto-focus input when light turns on
        setTimeout(() => {
          const pinInput = document.getElementById('lamp-login-pin-input');
          if (pinInput && this.selectedLoginRole === 'admin') {
            pinInput.focus();
          }
        }, 320);
      } else {
        stage.classList.remove('lamp-is-on');
        if (toggleText) toggleText.textContent = 'เปิดไฟ';
      }
    }
  }

  selectLoginRole(role) {
    this.selectedLoginRole = role;
    const adminBtn = document.getElementById('lamp-role-admin');
    const staffBtn = document.getElementById('lamp-role-staff');
    const pinGroup = document.getElementById('lamp-pin-field-group');
    const pinInput = document.getElementById('lamp-login-pin-input');

    if (role === 'admin') {
      adminBtn?.classList.remove('text-slate-400');
      adminBtn?.classList.add('bg-sky-600', 'text-white', 'shadow-sm');
      staffBtn?.classList.remove('bg-sky-600', 'text-white', 'shadow-sm');
      staffBtn?.classList.add('text-slate-400');
      if (pinGroup) pinGroup.classList.remove('hidden');
      if (pinInput) pinInput.placeholder = 'ใส่รหัสผ่านผู้ดูแล (memoadmin)...';
    } else {
      staffBtn?.classList.remove('text-slate-400');
      staffBtn?.classList.add('bg-sky-600', 'text-white', 'shadow-sm');
      adminBtn?.classList.remove('bg-sky-600', 'text-white', 'shadow-sm');
      adminBtn?.classList.add('text-slate-400');
      if (pinGroup) pinGroup.classList.add('hidden');
    }
  }

  submitLampLogin() {
    const errorMsg = document.getElementById('lamp-login-error');
    const pinInput = document.getElementById('lamp-login-pin-input');

    if (this.selectedLoginRole === 'admin') {
      const pin = pinInput ? pinInput.value.trim() : '';
      if (pin !== 'memoadmin') {
        if (errorMsg) errorMsg.classList.remove('hidden');
        if (pinInput) {
          pinInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/50');
          setTimeout(() => pinInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500/50'), 1500);
        }
        return;
      }
    }

    if (errorMsg) errorMsg.classList.add('hidden');
    this.isAuthenticated = true;
    localStorage.setItem('memo_authenticated', 'true');

    this.playSuccessChime();

    const stage = document.getElementById('lamp-login-stage');
    if (stage) {
      stage.classList.add('stage-hidden');
    }

    this.showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ Memo All In One', 'success');
  }

  lockScreen() {
    this.isAuthenticated = false;
    localStorage.removeItem('memo_authenticated');

    const stage = document.getElementById('lamp-login-stage');
    if (stage) {
      stage.classList.remove('stage-hidden');
      stage.classList.remove('lamp-is-on');
      this.isLampOn = false;
    }

    const pinInput = document.getElementById('lamp-login-pin-input');
    if (pinInput) pinInput.value = '';

    const errorMsg = document.getElementById('lamp-login-error');
    if (errorMsg) errorMsg.classList.add('hidden');

    const toggleText = document.getElementById('lamp-toggle-status-text');
    if (toggleText) toggleText.textContent = 'เปิดไฟ';

    this.showToast('ออกจากระบบและล็อกหน้าจอเรียบร้อยแล้ว', 'info');
  }

  // =========================================================================
  // View Navigation
  // =========================================================================
  navigateTo(viewId, docId = null) {
    this.currentView = viewId;
    
    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));

    // Highlight active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('bg-sky-700', 'text-white', 'font-semibold', 'nav-item-active');
      el.classList.add('text-slate-300');
      if (el.dataset.view === viewId) {
        el.classList.remove('text-slate-300');
        el.classList.add('nav-item-active', 'text-white');
      }
    });

    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.remove('hidden');
    }

    if (viewId === 'landing') {
      this.renderLandingStats();
      this.renderRecentDocsTable();
    } else if (viewId === 'editor') {
      if (docId) {
        this.loadDocForEditing(docId);
      } else if (!this.currentEditingDocId && !this.hasUserEditedForm()) {
        this.resetEditorForm();
      }
      this.checkAutosaveDraft();
      this.updateLivePreview();
      setTimeout(() => this.autoFitPreview(), 80);
    } else if (viewId === 'archive') {
      this.renderArchiveList();
    } else if (viewId === 'running-logs') {
      this.renderRunningLogsView();
    } else if (viewId === 'dashboard') {
      this.renderDashboard();
    }

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 1024) {
      if (sidebar) {
        sidebar.classList.toggle('mobile-open');
      }
      return;
    }

    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    const labels = document.querySelectorAll('.sidebar-label');
    const logoFull = document.getElementById('sidebar-logo-full');
    const logoIcon = document.getElementById('sidebar-logo-icon');
    const toggleTopBtn = document.getElementById('sidebar-toggle-top-btn');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');

    if (this.isSidebarCollapsed) {
      if (sidebar) {
        sidebar.classList.remove('w-72');
        sidebar.classList.add('w-20');
      }
      labels.forEach(l => l.classList.add('hidden'));
      if (logoFull) logoFull.classList.add('hidden');
      if (toggleTopBtn) toggleTopBtn.classList.add('hidden');
      if (logoIcon) logoIcon.classList.remove('hidden');
      if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'chevrons-right');
    } else {
      if (sidebar) {
        sidebar.classList.remove('w-20');
        sidebar.classList.add('w-72');
      }
      labels.forEach(l => l.classList.remove('hidden'));
      if (logoFull) logoFull.classList.remove('hidden');
      if (toggleTopBtn) toggleTopBtn.classList.remove('hidden');
      if (logoIcon) logoIcon.classList.add('hidden');
      if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'chevrons-left');
    }

    if (window.lucide) window.lucide.createIcons();

    // Readjust preview fit after sidebar animation
    setTimeout(() => {
      if (this.currentView === 'editor' && this.isFitMode) {
        this.autoFitPreview();
      }
    }, 280);
  }

  toggleFormPanel(forceState = null) {
    if (forceState !== null) {
      this.isFormPanelCollapsed = forceState;
    } else {
      this.isFormPanelCollapsed = !this.isFormPanelCollapsed;
    }

    const panel = document.getElementById('editor-form-panel');
    const expandBtn = document.getElementById('btn-expand-form-panel');
    const fullscreenBtnText = document.getElementById('btn-toggle-preview-text');
    const fullscreenBtnIcon = document.getElementById('btn-toggle-preview-icon');

    if (panel) {
      if (this.isFormPanelCollapsed) {
        panel.classList.add('form-panel-collapsed');
        if (expandBtn) expandBtn.classList.remove('hidden');
        if (fullscreenBtnText) fullscreenBtnText.textContent = 'แสดงฟอร์ม';
        if (fullscreenBtnIcon) {
          fullscreenBtnIcon.setAttribute('data-lucide', 'minimize-2');
        }
      } else {
        panel.classList.remove('form-panel-collapsed');
        if (expandBtn) expandBtn.classList.add('hidden');
        if (fullscreenBtnText) fullscreenBtnText.textContent = 'ขยายพรีวิวเต็มจอ';
        if (fullscreenBtnIcon) {
          fullscreenBtnIcon.setAttribute('data-lucide', 'maximize-2');
        }
      }
      if (window.lucide) window.lucide.createIcons();
    }

    // Auto fit scale once width transition completes
    setTimeout(() => {
      if (this.currentView === 'editor' && this.isFitMode) {
        this.autoFitPreview();
      }
    }, 320);
  }

  // =========================================================================
  // Master Presets & Company Dropdowns
  // =========================================================================
  renderCompanySelector() {
    const companies = window.storage.getCompanies();
    const activeComp = window.storage.getCompany(this.activeCompanyId);

    // Global Topbar Company Badges
    const selectEl = document.getElementById('company-selector');
    if (selectEl) {
      selectEl.innerHTML = `
        <option value="all" ${this.activeCompanyId === 'all' ? 'selected' : ''}>
          🌐 รวมทุกบริษัท (ดูทั้งหมด)
        </option>
        ${companies.map(c => `
          <option value="${c.id}" ${c.id === this.activeCompanyId ? 'selected' : ''}>
            ${c.name} (${c.code})
          </option>
        `).join('')}
      `;
    }

    // Update Topbar Active Badge
    const badgeName = document.getElementById('active-company-name');
    const badgeLogo = document.getElementById('active-company-logo');
    if (badgeName) {
      badgeName.textContent = this.activeCompanyId === 'all' ? 'รวมทุกบริษัท (ทุกหน่วยงาน)' : activeComp.name;
    }
    if (badgeLogo) {
      badgeLogo.src = this.activeCompanyId === 'all' ? 'assets/images/twp_logo.png' : activeComp.logo;
    }

    // Form Company Selector (In Editor: selects specific company)
    const formCompSelect = document.getElementById('form-company-select');
    if (formCompSelect) {
      const editorCompId = this.activeCompanyId === 'all' ? (companies[0]?.id || 'twp') : this.activeCompanyId;
      formCompSelect.innerHTML = companies.map(c => `
        <option value="${c.id}" ${c.id === editorCompId ? 'selected' : ''}>
          ${c.name}
        </option>
      `).join('');
    }
  }

  changeActiveCompany(companyId) {
    this.activeCompanyId = companyId;
    window.storage.setActiveCompanyId(companyId);
    this.archiveCompanyFilter = companyId;
    this.runningLogsCompanyFilter = companyId;
    this.renderCompanySelector();
    
    // Automatically re-render current view with the new company filter
    if (this.currentView === 'landing') {
      this.renderLandingStats();
      this.renderRecentDocsTable();
    } else if (this.currentView === 'archive') {
      this.renderArchiveList();
    } else if (this.currentView === 'running-logs') {
      this.renderRunningLogsView();
    } else if (this.currentView === 'dashboard') {
      this.renderDashboard();
    }

    // Sync company form inputs if in editor
    const effectiveCompId = companyId === 'all' ? (window.storage.getCompanies()[0]?.id || 'twp') : companyId;
    const comp = window.storage.getCompany(effectiveCompId);
    this.customLogoDataUrl = '';
    
    const formCompSelect = document.getElementById('form-company-select');
    if (formCompSelect && companyId !== 'all') {
      formCompSelect.value = companyId;
    }

    const nameInput = document.getElementById('form-company-name-input');
    const taxIdInput = document.getElementById('form-company-taxid-input');
    const telInput = document.getElementById('form-company-tel-input');
    const addrInput = document.getElementById('form-company-address-input');
    const logoPreview = document.getElementById('form-logo-preview');

    if (nameInput) nameInput.value = comp.name;
    if (taxIdInput) taxIdInput.value = comp.taxId || '';
    if (telInput) telInput.value = comp.tel || '';
    if (addrInput) addrInput.value = comp.address || '';
    if (logoPreview) logoPreview.src = comp.logo;

    if (this.currentView === 'editor') {
      this.updateNextNumberDisplay();
      this.updateLivePreview();
    }

    const msg = companyId === 'all' ? 'แสดงข้อมูลรวมทุกบริษัทในระบบ' : `สลับไปยัง "${comp.name}"`;
    this.showToast(msg, 'info');
  }

  renderPresets(preserveValues = true) {
    const recSelect = document.getElementById('form-recipient-select');
    const posSelect = document.getElementById('form-signer-position-select');
    const closeSelect = document.getElementById('form-closing-select');

    const prevRec = recSelect ? recSelect.value : '';
    const prevPos = posSelect ? posSelect.value : '';
    const prevClose = closeSelect ? closeSelect.value : '';

    // Recipients ("เรียน")
    const recList = window.storage.getRecipients();
    if (recSelect) {
      recSelect.innerHTML = `
        <option value="">-- เลือกผู้รับ / เรียน --</option>
        ${recList.map(r => `<option value="${r}">${r}</option>`).join('')}
        <option value="__custom__">+ พิมพ์ผู้รับเอง...</option>
      `;
      if (preserveValues && prevRec) {
        if ([...recSelect.options].some(o => o.value === prevRec)) {
          recSelect.value = prevRec;
        } else {
          recSelect.value = '__custom__';
          const customGroup = document.getElementById('form-recipient-custom-group');
          const customInput = document.getElementById('form-recipient-custom');
          if (customGroup) customGroup.classList.remove('hidden');
          if (customInput && !customInput.value) customInput.value = prevRec;
        }
      }
    }

    // Positions ("ตำแหน่ง")
    const posList = window.storage.getPositions();
    if (posSelect) {
      posSelect.innerHTML = `
        <option value="">-- เลือกตำแหน่งผู้ลงนาม --</option>
        ${posList.map(p => `<option value="${p}">${p}</option>`).join('')}
        <option value="__custom__">+ พิมพ์ตำแหน่งเอง...</option>
      `;
      if (preserveValues && prevPos) {
        if ([...posSelect.options].some(o => o.value === prevPos)) {
          posSelect.value = prevPos;
        } else {
          posSelect.value = '__custom__';
          const customGroup = document.getElementById('form-signer-position-custom-group');
          const customInput = document.getElementById('form-signer-position-custom');
          if (customGroup) customGroup.classList.remove('hidden');
          if (customInput && !customInput.value) customInput.value = prevPos;
        }
      }
    }

    // Closings ("ประโยคปิดท้าย")
    const closeList = window.storage.getClosings();
    if (closeSelect) {
      closeSelect.innerHTML = `
        <option value="">-- เลือกประโยคปิดท้าย --</option>
        ${closeList.map(c => `<option value="${c}">${c}</option>`).join('')}
        <option value="__custom__">+ พิมพ์ประโยคปิดท้ายเอง...</option>
      `;
      if (preserveValues && prevClose) {
        if ([...closeSelect.options].some(o => o.value === prevClose)) {
          closeSelect.value = prevClose;
        } else {
          closeSelect.value = '__custom__';
          const customGroup = document.getElementById('form-closing-custom-group');
          const customInput = document.getElementById('form-closing-custom');
          if (customGroup) customGroup.classList.remove('hidden');
          if (customInput && !customInput.value) customInput.value = prevClose;
        }
      }
    }

    // Subjects ("เรื่องที่เคยใช้")
    this.renderSubjectChips();
  }

  renderSubjectChips() {
    const subjects = window.storage.getSubjects();
    const chipsContainer = document.getElementById('subject-chips-container');
    if (!chipsContainer) return;

    // Show top 6 subjects as fast chips
    chipsContainer.innerHTML = subjects.slice(0, 6).map(s => `
      <button type="button" class="chip-btn text-xs bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap"
              onclick="window.app.applySubjectChip('${this.escapeHtml(s)}')">
        ${s}
      </button>
    `).join('');

    // Datalist for autocomplete input
    const datalist = document.getElementById('subjects-datalist');
    if (datalist) {
      datalist.innerHTML = subjects.map(s => `<option value="${s}"></option>`).join('');
    }
  }

  applySubjectChip(subjectText) {
    const input = document.getElementById('form-subject-input');
    if (input) {
      input.value = subjectText;
      this.updateLivePreview();
    }
  }

  // =========================================================================
  // Editor & Form Logic
  // =========================================================================
  resetEditorForm() {
    this.currentEditingDocId = null;
    this.signatureDataUrl = '';
    this.customLogoDataUrl = '';

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('form-doc-date').value = todayStr;
    document.getElementById('form-company-select').value = this.activeCompanyId;
    document.getElementById('form-doc-type').value = 'memo';

    const comp = window.storage.getCompany(this.activeCompanyId);
    document.getElementById('form-company-name-input').value = comp.name;
    document.getElementById('form-company-taxid-input').value = comp.taxId || '';
    document.getElementById('form-company-tel-input').value = comp.tel || '';
    document.getElementById('form-company-address-input').value = comp.address || '';
    document.getElementById('form-logo-preview').src = comp.logo;

    // Reset inputs
    document.getElementById('form-subject-input').value = '';
    document.getElementById('form-recipient-select').value = 'กรรมการผู้จัดการ';
    document.getElementById('form-recipient-custom').value = '';
    document.getElementById('form-recipient-custom-group').classList.add('hidden');

    document.getElementById('form-department-input').value = 'ฝ่ายบริหารและธุรการ';
    document.getElementById('form-signer-name-input').value = '';
    document.getElementById('form-signer-position-select').value = 'ผู้จัดการทั่วไป';
    document.getElementById('form-signer-position-custom').value = '';
    document.getElementById('form-signer-position-custom-group').classList.add('hidden');

    document.getElementById('form-closing-select').value = 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ';
    document.getElementById('form-closing-custom').value = '';
    document.getElementById('form-closing-custom-group').classList.add('hidden');

    // Salary Cert Specific Fields
    document.getElementById('form-emp-name').value = '';
    document.getElementById('form-emp-idcard').value = '';
    document.getElementById('form-emp-position').value = '';
    document.getElementById('form-emp-start-date').value = todayStr;
    document.getElementById('form-emp-salary').value = '35000';
    document.getElementById('form-emp-salary-text').value = 'สามหมื่นห้าพันบาทถ้วน';
    document.getElementById('form-emp-purpose').value = 'เพื่อใช้ประกอบการยื่นขอสินเชื่อ';

    // Content
    const editor = document.getElementById('rich-content-editor');
    if (editor) {
      editor.innerHTML = '<p>มีความประสงค์ขออนุมัติดำเนินการ...</p>';
    }

    // Reset Header Title (บันทึกภายใน เป็นค่าเริ่มต้น)
    const headerTitleSelect = document.getElementById('form-header-title-select');
    const headerTitleCustom = document.getElementById('form-header-title-custom');
    if (headerTitleSelect) headerTitleSelect.value = 'บันทึกภายใน';
    if (headerTitleCustom) headerTitleCustom.value = '';

    // Reset Footer Toggle
    const footerToggle = document.getElementById('form-show-footer-toggle');
    if (footerToggle) footerToggle.checked = false;

    // Update delete button text
    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ล้างข้อมูล / ยกเลิก';

    // Reset Attachments and Issued Number State
    this.currentAttachments = [];
    this.currentIssuedDocNumber = null;
    this.renderAttachmentsList();
    this.updateWorkflowSteps('new');

    this.toggleDocTypeFields('memo');
    this.updateNextNumberDisplay();
    this.updateLivePreview();
  }

  loadDocForEditing(docId) {
    const doc = window.storage.getDocument(docId);
    if (!doc) return;
    this.populateForm(doc);
    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ลบเอกสารฉบับนี้ทิ้ง';
  }

  populateForm(doc) {
    if (!doc) return;
    if (doc.id) this.currentEditingDocId = doc.id;
    this.activeCompanyId = doc.companyId || 'twp';
    this.signatureDataUrl = doc.signatureImg || '';
    this.customLogoDataUrl = doc.customLogo || '';

    const comp = window.storage.getCompany(this.activeCompanyId);

    document.getElementById('form-company-select').value = this.activeCompanyId;
    document.getElementById('form-company-name-input').value = doc.customCompanyName || comp.name;
    document.getElementById('form-company-taxid-input').value = doc.customTaxId !== undefined ? doc.customTaxId : (comp.taxId || '');
    document.getElementById('form-company-tel-input').value = doc.customTel !== undefined ? doc.customTel : (comp.tel || '');
    document.getElementById('form-company-address-input').value = doc.customAddress !== undefined ? doc.customAddress : (comp.address || '');
    document.getElementById('form-logo-preview').src = this.customLogoDataUrl || comp.logo;

    document.getElementById('form-doc-type').value = doc.docType || 'memo';
    document.getElementById('form-doc-date').value = doc.date || new Date().toISOString().split('T')[0];
    document.getElementById('form-subject-input').value = doc.subject || '';
    document.getElementById('form-department-input').value = doc.department || '';
    document.getElementById('form-signer-name-input').value = doc.signerName || '';

    // Recipient
    const recSelect = document.getElementById('form-recipient-select');
    if (recSelect) {
      if ([...recSelect.options].some(o => o.value === doc.toRecipient)) {
        recSelect.value = doc.toRecipient;
        document.getElementById('form-recipient-custom-group')?.classList.add('hidden');
      } else {
        recSelect.value = '__custom__';
        document.getElementById('form-recipient-custom-group')?.classList.remove('hidden');
        document.getElementById('form-recipient-custom').value = doc.toRecipient || '';
      }
    }

    // Position
    const posSelect = document.getElementById('form-signer-position-select');
    if (posSelect) {
      if ([...posSelect.options].some(o => o.value === doc.signerPosition)) {
        posSelect.value = doc.signerPosition;
        document.getElementById('form-signer-position-custom-group')?.classList.add('hidden');
      } else {
        posSelect.value = '__custom__';
        document.getElementById('form-signer-position-custom-group')?.classList.remove('hidden');
        document.getElementById('form-signer-position-custom').value = doc.signerPosition || '';
      }
    }

    // Closing
    const closeSelect = document.getElementById('form-closing-select');
    if (closeSelect) {
      if ([...closeSelect.options].some(o => o.value === doc.closing)) {
        closeSelect.value = doc.closing;
        document.getElementById('form-closing-custom-group')?.classList.add('hidden');
      } else {
        closeSelect.value = '__custom__';
        document.getElementById('form-closing-custom-group')?.classList.remove('hidden');
        document.getElementById('form-closing-custom').value = doc.closing || '';
      }
    }

    // Salary Cert Specific
    if (doc.docType === 'salary_cert' || doc.docType === 'work_cert') {
      document.getElementById('form-emp-name').value = doc.employeeName || '';
      document.getElementById('form-emp-idcard').value = doc.employeeIdCard || '';
      document.getElementById('form-emp-position').value = doc.employeePosition || '';
      document.getElementById('form-emp-start-date').value = doc.startDate || '';
      document.getElementById('form-emp-salary').value = doc.salaryAmount || '';
      document.getElementById('form-emp-salary-text').value = doc.salaryText || '';
      document.getElementById('form-emp-purpose').value = doc.certPurpose || '';
    }

    // Editor content
    const editor = document.getElementById('rich-content-editor');
    if (editor) {
      editor.innerHTML = doc.content || '';
    }

    // Document Header Title
    const headerTitleSelect = document.getElementById('form-header-title-select');
    const headerTitleCustom = document.getElementById('form-header-title-custom');
    if (headerTitleSelect) {
      const savedTitle = doc.headerTitle || (doc.docType === 'memo' ? 'บันทึกภายใน' : '');
      if (['บันทึกภายใน', 'บันทึกข้อความ'].includes(savedTitle)) {
        headerTitleSelect.value = savedTitle;
        if (headerTitleCustom) headerTitleCustom.value = '';
      } else if (savedTitle) {
        headerTitleSelect.value = '__custom__';
        if (headerTitleCustom) headerTitleCustom.value = savedTitle;
      } else {
        headerTitleSelect.value = 'บันทึกภายใน';
        if (headerTitleCustom) headerTitleCustom.value = '';
      }
    }

    // Footer Toggle
    const footerToggle = document.getElementById('form-show-footer-toggle');
    if (footerToggle) {
      footerToggle.checked = Boolean(doc.showFooter);
    }

    // Restore Attachments and Issued Number State
    this.currentAttachments = (doc.attachments && Array.isArray(doc.attachments)) ? [...doc.attachments] : [];
    this.currentIssuedDocNumber = (doc.docNumber && !doc.docNumber.includes('(ฉบับร่าง)')) ? doc.docNumber : null;
    this.renderAttachmentsList();
    this.updateWorkflowSteps(doc.status || 'published');

    this.toggleDocTypeFields(doc.docType || 'memo');
    this.updateNextNumberDisplay(doc.docNumber);
    this.updateLivePreview();
  }

  hasUserEditedForm() {
    const subject = document.getElementById('form-subject-input')?.value?.trim();
    const editor = document.getElementById('rich-content-editor');
    const content = editor?.innerHTML?.trim() || '';
    const isDefaultContent = !content || content === '<p>มีความประสงค์ขออนุมัติดำเนินการ...</p>' || content === '<p><br></p>';
    const signerName = document.getElementById('form-signer-name-input')?.value?.trim();
    const empName = document.getElementById('form-emp-name')?.value?.trim();
    const hasAttachments = this.currentAttachments && this.currentAttachments.length > 0;
    
    return Boolean(subject || !isDefaultContent || signerName || empName || hasAttachments || this.currentEditingDocId);
  }

  // =========================================================================
  // Autosave Draft Mechanics
  // =========================================================================
  initAutosave() {
    this.checkAutosaveDraft();

    let autosaveTimer = null;
    const triggerAutosave = () => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        this.saveAutosaveDraft();
      }, 1200);
    };

    const form = document.getElementById('doc-editor-form');
    if (form) {
      form.addEventListener('input', triggerAutosave);
      form.addEventListener('change', triggerAutosave);
    }
  }

  checkAutosaveDraft() {
    const draft = window.storage.getAutosaveDraft();
    const banner = document.getElementById('autosave-restore-banner');
    const timeEl = document.getElementById('autosave-draft-time');
    if (!banner) return;

    if (draft && !this.currentEditingDocId && (draft.subject || (draft.content && draft.content.length > 50))) {
      banner.classList.remove('hidden');
      if (timeEl && draft.savedAt) {
        const time = new Date(draft.savedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        timeEl.textContent = `ฉบับร่างบันทึกอัตโนมัติ: ${time} น. (${draft.subject || 'ยังไม่ระบุชื่อเรื่อง'})`;
      }
    } else {
      banner.classList.add('hidden');
    }
  }

  saveAutosaveDraft() {
    if (this.currentEditingDocId) return; // Existing doc already in DB
    if (!this.hasUserEditedForm()) return;
    const data = this.gatherFormData(false);
    window.storage.setAutosaveDraft(data);
  }

  restoreAutosaveDraft() {
    const draft = window.storage.getAutosaveDraft();
    if (!draft) return;
    this.populateForm(draft);
    document.getElementById('autosave-restore-banner')?.classList.add('hidden');
    this.showToast('กู้คืนแบบร่างเดิมสำเร็จแล้ว', 'success');
  }

  dismissAutosaveDraft() {
    window.storage.clearAutosaveDraft();
    document.getElementById('autosave-restore-banner')?.classList.add('hidden');
    this.resetEditorForm();
    this.showToast('ลบแบบร่างเดิมแล้ว เริ่มต้นใหม่', 'info');
  }

  toggleDocTypeFields(docType) {
    const certFields = document.getElementById('certificate-specific-fields');
    const salaryOnly = document.getElementById('salary-only-fields');
    const memoRecFields = document.getElementById('memo-recipient-fields');
    const headerTitleContainer = document.getElementById('memo-header-title-container');
    const headerTitleSelect = document.getElementById('form-header-title-select');

    if (headerTitleContainer) {
      if (docType === 'memo') {
        headerTitleContainer.classList.remove('hidden');
        if (headerTitleSelect && !headerTitleSelect.value) {
          headerTitleSelect.value = 'บันทึกภายใน';
        }
      } else {
        headerTitleContainer.classList.add('hidden');
      }
    }

    if (docType === 'salary_cert') {
      certFields.classList.remove('hidden');
      salaryOnly.classList.remove('hidden');
      memoRecFields.classList.remove('hidden');
    } else if (docType === 'work_cert') {
      certFields.classList.remove('hidden');
      salaryOnly.classList.add('hidden');
      memoRecFields.classList.remove('hidden');
    } else {
      certFields.classList.add('hidden');
      memoRecFields.classList.remove('hidden');
    }
  }

  updateNextNumberDisplay(existingNumber = null) {
    const compId = document.getElementById('form-company-select').value;
    const docType = document.getElementById('form-doc-type').value;
    const badge = document.getElementById('editor-next-number-badge');

    if (existingNumber) {
      badge.textContent = `เลขที่เอกสาร: ${existingNumber}`;
      badge.className = 'text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200';
    } else {
      const nextNum = window.storage.peekNextNumber(compId, docType);
      badge.textContent = `เลขถัดไปที่จะได้รับ: ${nextNum}`;
      badge.className = 'text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 animate-pulse';
    }
  }

  // =========================================================================
  // Live A4 Preview & Universal PDF Renderer
  // =========================================================================
  buildDocHtml(d) {
    const comp = window.storage.getCompany(d.companyId);
    const compName = d.customCompanyName || comp.name;
    const compTaxId = (d.customTaxId !== undefined && d.customTaxId !== '') ? d.customTaxId : (comp.taxId || '');
    const compTel = (d.customTel !== undefined && d.customTel !== '') ? d.customTel : (comp.tel || '');
    const compAddress = (d.customAddress !== undefined && d.customAddress !== '') ? d.customAddress : (comp.address || '');
    const compLogo = d.customLogo || comp.logo;

    const docType = d.docType || 'memo';
    const docDate = d.date || new Date().toISOString().split('T')[0];
    const thaiDate = window.Utils.formatThaiDateFull(docDate);
    const displayDocNo = d.docNumber || 'ฉบับร่าง (รอออกเลขที่)';
    const subject = d.subject || '...................................................';
    const recipient = d.toRecipient || '...................................................';
    const department = d.department || '';
    const closing = d.closing || 'จึงเรียนมาเพื่อโปรดทราบ';
    const signerName = d.signerName || '...................................................';
    const signerPos = d.signerPosition || '...................................................';
    const contentHtml = d.content || '';
    const headerTitle = d.headerTitle || (docType === 'memo' ? 'บันทึกภายใน' : '');

    let sigVisual = '';
    if (d.signatureImg) {
      sigVisual = `<img src="${d.signatureImg}" class="signature-img-preview" alt="ลายเซ็น">`;
    } else {
      sigVisual = `<div class="h-14 flex items-end justify-center"><div class="w-48 border-b border-dotted border-slate-700"></div></div>`;
    }

    // Shared Standard Footer Component (แสดงหน่วยงาน, โทรศัพท์ และเลขผู้เสียภาษี)
    const shouldShowFooter = d.showFooter ?? (docType === 'salary_cert' || docType === 'work_cert');
    const footerHtml = shouldShowFooter ? `
      <div class="doc-footer text-left mt-auto pt-2.5 border-t border-slate-200 text-[9.5pt] text-slate-600 leading-normal" style="font-family:'TH Sarabun New','Sarabun','Cordia New','Leelawadee UI','Tahoma',sans-serif;">
        <div>
          <span class="font-semibold text-slate-800">${compName}</span>
          ${department ? ` | <span>หน่วยงาน: ${department}</span>` : ''}
          ${compTel ? ` | <span>โทรศัพท์: ${compTel}</span>` : ''}
        </div>
        ${compTaxId ? `<div>เลขประจำตัวผู้เสียภาษี: <span class="font-mono text-slate-700 font-semibold">${compTaxId}</span></div>` : ''}
        ${compAddress ? `<div class="text-slate-500">${compAddress}</div>` : ''}
      </div>
    ` : '';

    if (docType === 'memo') {
      return `
        <div class="doc-sheet-inner flex-1 flex flex-col justify-between" style="font-family:'TH Sarabun New','Sarabun','Cordia New','Leelawadee UI','Tahoma',sans-serif;">
          <div>
            <!-- Top Left: Logo + Company Name horizontally side-by-side -->
            <div class="doc-header-top flex items-center mb-3">
              <img src="${compLogo}" alt="Logo" class="h-12 w-12 object-contain mr-3 shrink-0">
              <span class="text-[16pt] font-bold text-black tracking-wide">${compName}</span>
            </div>

            <!-- Center Document Title (e.g. บันทึก / บันทึกภายใน / บันทึกข้อความ) -->
            <div class="text-center my-2">
              <h1 class="doc-header-title text-[22pt] font-bold text-black tracking-wide leading-tight">${headerTitle || 'บันทึก'}</h1>
            </div>

            <!-- Right-aligned Date -->
            <div class="text-right mb-3 text-[15pt]">
              วันที่ ${thaiDate}
            </div>

            <!-- Left Metadata: ที่ / เรื่อง / เรียน using aligned 2-column table -->
            <div class="doc-meta-block mb-3 text-[15pt]">
              <table style="width: 100%; border: none; border-collapse: collapse; font-size: 15pt; line-height: 1.6;">
                <tbody>
                  ${(displayDocNo && displayDocNo !== '-' && !displayDocNo.includes('(รอออกเลขที่)')) ? `
                    <tr>
                      <td style="width: 1.8cm; font-weight: bold; vertical-align: top; padding: 2px 0;">ที่</td>
                      <td style="font-weight: 600; color: #000; vertical-align: top; padding: 2px 0;">${displayDocNo}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="width: 1.8cm; font-weight: bold; vertical-align: top; padding: 2px 0;">เรื่อง</td>
                    <td style="font-weight: 600; color: #000; vertical-align: top; padding: 2px 0;">${subject}</td>
                  </tr>
                  <tr>
                    <td style="width: 1.8cm; font-weight: bold; vertical-align: top; padding: 2px 0;">เรียน</td>
                    <td style="vertical-align: top; padding: 2px 0;">${recipient}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Document Content -->
            <div class="doc-content my-3 text-[15pt] leading-[1.75] text-justify">
              ${contentHtml}
            </div>

            <!-- Attachments / สิ่งที่ส่งมาด้วย (ถ้ามี) -->
            ${(d.attachments && Array.isArray(d.attachments) && d.attachments.length > 0) ? `
              <div class="doc-attachments-block my-2 text-[14pt] leading-normal text-slate-800">
                <div class="font-bold text-black mb-1">สิ่งที่ส่งมาด้วย / เอกสารแนบ:</div>
                <ol class="list-decimal list-inside ml-2 space-y-0.5">
                  ${d.attachments.map(a => `<li class="font-normal text-slate-800">${a.name} ${a.size ? `<span class="text-[12pt] text-slate-500">(${window.Utils.formatFileSize(a.size)})</span>` : ''}</li>`).join('')}
                </ol>
              </div>
            ` : ''}

            <!-- Closing -->
            <div class="doc-closing my-4 text-[15pt] leading-[1.75]" style="text-indent: 2.5cm;">
              <p>${closing}</p>
            </div>

            <!-- Signature Block on Right Side -->
            <div class="signature-box ml-auto text-center mt-5" style="width: 280px;">
              ${sigVisual ? `<div class="mb-2">${sigVisual}</div>` : `<div class="mb-2 tracking-widest text-slate-400">...................................................</div>`}
              <div class="text-[15pt]">
                <p class="font-normal">${signerName ? `(${signerName})` : ''}</p>
                <p class="text-[14pt] text-slate-700 mt-1">${signerPos}</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          ${footerHtml}
        </div>
      `;
    } else if (docType === 'announcement') {
      return `
        <div class="doc-sheet-inner flex-1 flex flex-col justify-between" style="font-family:'TH Sarabun New','Sarabun','Cordia New','Leelawadee UI','Tahoma',sans-serif;">
          <div>
            <!-- Top Left: Logo + Company Name directly below it -->
            <div class="doc-header-top text-left mb-4">
              <img src="${compLogo}" alt="Logo" class="max-h-14 max-w-[180px] object-contain mb-2 block">
              <div class="text-[16pt] font-bold text-black tracking-wide">${compName}</div>
            </div>

            <!-- Center Document Title: ประกาศ -->
            <div class="text-center my-4">
              <h1 class="doc-header-title text-[22pt] font-bold text-black tracking-wide leading-tight">${headerTitle || 'ประกาศ'}</h1>
            </div>

            <!-- Left Metadata: เลขที่ / เรื่อง using aligned 2-column table -->
            <div class="doc-meta-block mb-4 text-[15pt]">
              <table style="width: 100%; border: none; border-collapse: collapse; font-size: 15pt; line-height: 1.6;">
                <tbody>
                  ${(displayDocNo && displayDocNo !== '-') ? `
                    <tr>
                      <td style="width: 1.8cm; font-weight: bold; vertical-align: top; padding: 2px 0;">เลขที่</td>
                      <td style="font-weight: 600; color: #000; vertical-align: top; padding: 2px 0;">${displayDocNo}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="width: 1.8cm; font-weight: bold; vertical-align: top; padding: 2px 0;">เรื่อง</td>
                    <td style="font-weight: 600; color: #000; vertical-align: top; padding: 2px 0;">${subject}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Document Content -->
            <div class="doc-content my-4 text-[15pt] leading-[1.85] text-justify">
              ${contentHtml}
            </div>

            <!-- Closing -->
            <div class="doc-closing my-6 text-[15pt] leading-[1.85]" style="text-indent: 2.5cm;">
              <p>${closing}</p>
            </div>

            <!-- Center Date and Signature Block -->
            <div class="text-center mt-8">
              <div class="text-[15pt] mb-4">
                ประกาศ ณ วันที่ ${thaiDate}
              </div>
              <div class="inline-block text-center" style="min-width: 260px;">
                ${sigVisual ? `<div class="mb-2">${sigVisual}</div>` : `<div class="mb-2 tracking-widest text-slate-400">...................................................</div>`}
                <div class="text-[15pt]">
                  <p class="font-normal">${signerName ? `(${signerName})` : ''}</p>
                  <p class="text-[14pt] text-slate-700 mt-1">${signerPos}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          ${footerHtml}
        </div>
      `;
    } else if (docType === 'salary_cert') {
      const empName = d.employeeName || '...................................................';
      const empIdCard = d.employeeIdCard || '...................................................';
      const empPos = d.employeePosition || '...................................................';
      const thaiStartDate = window.Utils.formatThaiDateFull(d.startDate);
      const salaryFormatted = window.Utils.formatMoney(d.salaryAmount || 0);
      const salaryText = d.salaryText || window.Utils.thaiBahtText(d.salaryAmount || 0);
      const purpose = d.certPurpose || 'เพื่อใช้เป็นหลักฐานประกอบการทำธุรกรรม';

      return `
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="border-b-2 border-slate-800 pb-4 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <img src="${compLogo}" alt="Logo" class="max-h-16 object-contain">
                  <div>
                    <h2 class="font-bold text-slate-900 text-lg">${compName}</h2>
                  </div>
                </div>
                <div class="text-right text-xs text-slate-500">
                  <p class="font-semibold text-slate-700">เอกสารสำคัญทางการ</p>
                </div>
              </div>
            </div>

            <div class="text-center mb-6">
              <h1 class="text-2xl font-bold tracking-wide">หนังสือรับรองเงินเดือน</h1>
              <p class="text-[13pt] text-slate-600 mt-1">เลขที่: <span class="font-semibold text-black">${displayDocNo}</span></p>
            </div>

            <div class="my-4 text-[15pt] flex justify-between">
              <div><span class="font-bold">เรียน:</span> ${recipient}</div>
              <div><span class="font-bold">วันที่:</span> ${thaiDate}</div>
            </div>

            <div class="doc-content my-6 leading-relaxed text-[15pt] space-y-4">
              <p>
                หนังสือฉบับนี้ออกให้เพื่อรับรองว่า <strong>${empName}</strong> เลขประจำตัวประชาชน <strong>${empIdCard}</strong> 
                เป็นพนักงานประจำของ <strong>${compName}</strong> จริง โดยเริ่มเข้าปฏิบัติงานตั้งแต่วันที่ <strong>${thaiStartDate}</strong> 
                ปัจจุบันดำรงตำแหน่ง <strong>${empPos}</strong>
              </p>
              <p>
                และได้รับเงินเดือนในอัตราเดือนละ <strong>${salaryFormatted} บาท</strong> (<strong>${salaryText}</strong>) 
                โดยมิได้รวมค่าล่วงเวลาและสวัสดิการอื่นๆ ของบริษัทฯ
              </p>
              <p>
                หนังสือรับรองฉบับนี้ออกให้ ${purpose}
              </p>
            </div>

            <div class="my-6 text-[15pt]" style="text-indent: 2.5cm;">
              <p>${closing}</p>
            </div>

            <div class="flex justify-between items-end mt-12 mb-4">
              <div class="w-36 h-36 border border-dashed border-slate-400 rounded-full flex items-center justify-center text-xs text-slate-400 text-center p-2">
                ประทับตรานิติบุคคล<br>(ถ้ามี)
              </div>

              <div class="signature-box">
                ${sigVisual}
                <div class="mt-2 text-[15pt]">
                  <p>(${signerName})</p>
                  <p class="text-[14pt] text-slate-800 mt-1">${signerPos}</p>
                  <p class="text-[13pt] text-slate-600 mt-1">${compName}</p>
                </div>
              </div>
            </div>
          </div>

          ${footerHtml}
        </div>
      `;
    } else if (docType === 'work_cert') {
      const empName = d.employeeName || '...................................................';
      const empIdCard = d.employeeIdCard || '...................................................';
      const empPos = d.employeePosition || '...................................................';
      const thaiStartDate = window.Utils.formatThaiDateFull(d.startDate);
      const purpose = d.certPurpose || 'เพื่อใช้เป็นหลักฐานประกอบการสมัครงาน / ยื่นขอเอกสาร';

      return `
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="border-b-2 border-slate-800 pb-4 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <img src="${compLogo}" alt="Logo" class="max-h-16 object-contain">
                  <div>
                    <h2 class="font-bold text-slate-900 text-lg">${compName}</h2>
                  </div>
                </div>
                <div class="text-right text-xs text-slate-500">
                  <p class="font-semibold text-slate-700">เอกสารสำคัญทางการ</p>
                </div>
              </div>
            </div>

            <div class="text-center mb-6">
              <h1 class="text-2xl font-bold tracking-wide">หนังสือรับรองการทำงาน</h1>
              <p class="text-[13pt] text-slate-600 mt-1">เลขที่: <span class="font-semibold text-black">${displayDocNo}</span></p>
            </div>

            <div class="my-4 text-[15pt] flex justify-between">
              <div><span class="font-bold">เรียน:</span> ${recipient}</div>
              <div><span class="font-bold">วันที่:</span> ${thaiDate}</div>
            </div>

            <div class="doc-content my-6 leading-relaxed text-[15pt] space-y-4">
              <p>
                หนังสือฉบับนี้ออกให้เพื่อรับรองว่า <strong>${empName}</strong> เลขประจำตัวประชาชน <strong>${empIdCard}</strong> 
                ได้ปฏิบัติงานกับ <strong>${compName}</strong> ตั้งแต่วันที่ <strong>${thaiStartDate}</strong> 
                จนถึงปัจจุบัน ในตำแหน่ง <strong>${empPos}</strong>
              </p>
              <p>
                ตลอดระยะเวลาการปฏิบัติงานที่ผ่านมา พนักงานผู้นี้มีความรับผิดชอบ ปฏิบัติงานด้วยความซื่อสัตย์สุจริต และปฏิบัติตามกฎระเบียบข้อบังคับของบริษัทฯ เป็นอย่างดีสม่ำเสมอ
              </p>
              <p>
                หนังสือรับรองฉบับนี้ออกให้ ${purpose}
              </p>
            </div>

            <div class="my-6 text-[15pt]" style="text-indent: 2.5cm;">
              <p>${closing}</p>
            </div>

            <div class="flex justify-between items-end mt-12 mb-4">
              <div class="w-36 h-36 border border-dashed border-slate-400 rounded-full flex items-center justify-center text-xs text-slate-400 text-center p-2">
                ประทับตรานิติบุคคล<br>(ถ้ามี)
              </div>

              <div class="signature-box">
                ${sigVisual}
                <div class="mt-2 text-[15pt]">
                  <p>(${signerName})</p>
                  <p class="text-[14pt] text-slate-800 mt-1">${signerPos}</p>
                  <p class="text-[13pt] text-slate-600 mt-1">${compName}</p>
                </div>
              </div>
            </div>
          </div>

          ${footerHtml}
        </div>
      `;
    }
    return '';
  }

  updateLivePreview() {
    const data = this.gatherFormData(false);
    if (this.currentEditingDocId) {
      const doc = window.storage.getDocument(this.currentEditingDocId);
      if (doc && doc.docNumber) data.docNumber = doc.docNumber;
    }

    const previewContainer = document.getElementById('a4-print-target');
    if (!previewContainer) return;

    previewContainer.innerHTML = this.buildDocHtml(data);

    // Refresh wrapper dimensions if in scaled mode
    if (this.currentZoom) {
      this.setPreviewScale(this.currentZoom, this.isFitMode);
    }
  }

  openPdfPreviewModal(docId = null) {
    let doc = null;
    if (this.currentView === 'editor') {
      // Always capture live inputs currently on screen in the editor
      doc = this.gatherFormData(false);
      if (this.currentEditingDocId) {
        const existing = window.storage.getDocument(this.currentEditingDocId);
        if (existing && existing.docNumber) doc.docNumber = existing.docNumber;
      }
    } else if (docId) {
      doc = window.storage.getDocument(docId);
    } else {
      doc = this.gatherFormData(false);
      if (this.currentEditingDocId) {
        const existing = window.storage.getDocument(this.currentEditingDocId);
        if (existing && existing.docNumber) doc.docNumber = existing.docNumber;
      }
    }

    if (!doc) {
      this.showToast('ไม่พบข้อมูลเอกสารสำหรับพิมพ์', 'error');
      return;
    }

    const html = this.buildDocHtml(doc);
    const wrapper = document.getElementById('pdf-modal-sheet-wrapper');
    if (wrapper) wrapper.innerHTML = html;

    const titleEl = document.getElementById('pdf-modal-title');
    const subtitleEl = document.getElementById('pdf-modal-subtitle');
    const comp = window.storage.getCompany(doc.companyId);

    if (titleEl) {
      titleEl.textContent = `พิมพ์ / ส่งออกเอกสาร: ${doc.docNumber || 'ฉบับร่าง'}`;
    }
    if (subtitleEl) {
      subtitleEl.textContent = `${doc.subject || 'เอกสารทางการ'} (${comp.name})`;
    }

    const cleanFilename = window.Utils.generateDocFileName(doc, comp, 'pdf');
    const wordFilename = window.Utils.generateDocFileName(doc, comp, 'doc');

    const printBtn = document.getElementById('pdf-modal-btn-print');
    if (printBtn) {
      printBtn.onclick = () => window.Utils.printDocument(doc, comp);
    }

    const viewTabBtn = document.getElementById('pdf-modal-btn-view-tab');
    if (viewTabBtn) {
      viewTabBtn.onclick = () => window.Utils.openPrintPreviewTab(doc, comp);
    }

    const dlBtn = document.getElementById('pdf-modal-btn-download');
    if (dlBtn) {
      dlBtn.onclick = () => {
        window.Utils.exportToPdf('pdf-modal-sheet-wrapper', cleanFilename, doc, comp);
      };
    }

    const wordBtn = document.getElementById('pdf-modal-btn-word');
    if (wordBtn) {
      wordBtn.onclick = () => {
        window.Utils.exportToWord(doc, wordFilename, comp);
      };
    }

    this.openModal('pdf-preview-modal');
    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // Fit to Screen & Scale Controls (มองเห็นเอกสารได้เต็ม)
  // =========================================================================
  autoFitPreview() {
    const container = document.querySelector('.a4-preview-container');
    if (!container) return;

    const availableWidth = container.clientWidth - 40;
    const a4StandardWidth = 794; // approx px width of 210mm in browser

    let scale = availableWidth / a4StandardWidth;
    if (scale > 1.15) scale = 1.15;
    if (scale < 0.32) scale = 0.32;

    this.setPreviewScale(Math.round(scale * 100) / 100, true);
  }

  setPreviewScale(scale, isFit = false) {
    this.currentZoom = scale;
    this.isFitMode = isFit;

    const sheet = document.getElementById('a4-print-target');
    const wrapper = document.getElementById('a4-sheet-wrapper');
    const label = document.getElementById('preview-scale-label');

    if (sheet && wrapper) {
      sheet.style.transform = `scale(${scale})`;
      sheet.style.transformOrigin = 'top center';
      wrapper.style.width = `${Math.round(794 * scale)}px`;
      const baseHeight = sheet.offsetHeight || 1123;
      wrapper.style.height = `${Math.round(baseHeight * scale)}px`;
    }

    if (label) {
      label.textContent = isFit ? `พอดีจอ (${Math.round(scale * 100)}%)` : `${Math.round(scale * 100)}%`;
    }
  }

  // =========================================================================
  // Save Draft, Issue & Delete Document
  // =========================================================================
  gatherFormData(isPublishing = false) {
    const compId = document.getElementById('form-company-select').value;
    const docType = document.getElementById('form-doc-type').value;
    const docDate = document.getElementById('form-doc-date').value;
    const subject = document.getElementById('form-subject-input').value.trim();

    // Document Header Title (สำหรับบันทึกภายใน / บันทึกข้อความ)
    let headerTitle = 'บันทึกภายใน';
    const headerTitleSelect = document.getElementById('form-header-title-select');
    const headerTitleCustom = document.getElementById('form-header-title-custom');
    if (headerTitleSelect) {
      if (headerTitleSelect.value === '__custom__') {
        headerTitle = headerTitleCustom?.value.trim() || 'บันทึกภายใน';
      } else if (headerTitleSelect.value) {
        headerTitle = headerTitleSelect.value;
      }
    }

    // Custom Company & Branding overrides
    const customCompanyName = document.getElementById('form-company-name-input')?.value.trim() || '';
    const customTaxId = document.getElementById('form-company-taxid-input')?.value.trim() || '';
    const customTel = document.getElementById('form-company-tel-input')?.value.trim() || '';
    const customAddress = document.getElementById('form-company-address-input')?.value.trim() || '';

    // Recipient
    const recSelectVal = document.getElementById('form-recipient-select').value;
    const toRecipient = recSelectVal === '__custom__'
      ? document.getElementById('form-recipient-custom').value.trim()
      : recSelectVal;

    // Position
    const posSelectVal = document.getElementById('form-signer-position-select').value;
    const signerPosition = posSelectVal === '__custom__'
      ? document.getElementById('form-signer-position-custom').value.trim()
      : posSelectVal;

    // Closing
    const closeSelectVal = document.getElementById('form-closing-select').value;
    const closing = closeSelectVal === '__custom__'
      ? document.getElementById('form-closing-custom').value.trim()
      : closeSelectVal;

    const department = document.getElementById('form-department-input').value.trim();
    const signerName = document.getElementById('form-signer-name-input').value.trim();
    const content = document.getElementById('rich-content-editor').innerHTML;

    // Certificate fields
    const employeeName = document.getElementById('form-emp-name').value.trim();
    const employeeIdCard = document.getElementById('form-emp-idcard').value.trim();
    const employeePosition = document.getElementById('form-emp-position').value.trim();
    const startDate = document.getElementById('form-emp-start-date').value;
    const salaryAmount = parseFloat(document.getElementById('form-emp-salary').value) || 0;
    const salaryText = document.getElementById('form-emp-salary-text').value.trim();
    const certPurpose = document.getElementById('form-emp-purpose').value.trim();
    const showFooter = document.getElementById('form-show-footer-toggle')?.checked ?? false;

    return {
      companyId: compId,
      customCompanyName,
      customTaxId,
      customTel,
      customAddress,
      customLogo: this.customLogoDataUrl,
      docType,
      headerTitle,
      date: docDate,
      subject: subject || (docType === 'salary_cert' ? 'หนังสือรับรองเงินเดือน' : headerTitle),
      toRecipient,
      department,
      closing,
      signerName,
      signerPosition,
      content,
      signatureImg: this.signatureDataUrl,
      employeeName,
      employeeIdCard,
      employeePosition,
      startDate,
      salaryAmount,
      salaryText,
      certPurpose,
      showFooter,
      attachments: this.currentAttachments ? [...this.currentAttachments] : [],
      docNumber: this.currentIssuedDocNumber || ''
    };
  }

  saveCompanyDefaults() {
    const compId = document.getElementById('form-company-select').value;
    const currentComp = window.storage.getCompany(compId);

    const name = document.getElementById('form-company-name-input')?.value.trim() || currentComp.name;
    const taxId = document.getElementById('form-company-taxid-input')?.value.trim() || '';
    const tel = document.getElementById('form-company-tel-input')?.value.trim() || '';
    const address = document.getElementById('form-company-address-input')?.value.trim() || '';
    const logo = this.customLogoDataUrl || currentComp.logo;

    const updatedComp = {
      ...currentComp,
      name,
      taxId,
      tel,
      address,
      logo
    };

    window.storage.saveCompany(updatedComp);
    this.renderCompanySelector();
    this.updateLivePreview();
    this.showToast(`บันทึกข้อมูลและโลโก้เป็นค่าเริ่มต้นของ "${name}" เรียบร้อยแล้ว (จะถูกใช้ตลอดไปจนกว่าจะแก้ไขใหม่)`, 'success');
  }

  // =========================================================================
  // Enhanced 3-Step Document Workflow
  // Step 1: issueNumberFirst() - Issue genuine Running Number immediately
  // Step 2: Fill in content, presets, attachments
  // Step 3: confirmAndPublishDoc() - Finalize & Confirm against the issued number
  // =========================================================================

  issueNumberFirst() {
    const compId = document.getElementById('form-company-select').value;
    const docType = document.getElementById('form-doc-type').value;

    // Check if doc already has a real published number
    if (this.currentIssuedDocNumber && !this.currentIssuedDocNumber.includes('(ฉบับร่าง)')) {
      this.showToast(`เอกสารฉบับนี้มีเลขที่ทางการแล้ว: ${this.currentIssuedDocNumber}`, 'info');
      return;
    }

    if (this.currentEditingDocId) {
      const existing = window.storage.getDocument(this.currentEditingDocId);
      if (existing && existing.docNumber && !existing.docNumber.includes('(ฉบับร่าง)')) {
        this.currentIssuedDocNumber = existing.docNumber;
        this.updateWorkflowSteps('issued');
        this.showToast(`เอกสารฉบับนี้มีเลขที่ทางการแล้ว: ${existing.docNumber}`, 'info');
        return;
      }
    }

    const subject = document.getElementById('form-subject-input')?.value.trim() || 'ไม่ระบุชื่อเรื่อง';
    const signerName = document.getElementById('form-signer-name-input')?.value.trim() || '';

    // Issue sequential running number immediately
    const issueResult = window.storage.issueRunningNumber(
      compId,
      docType,
      this.currentEditingDocId,
      subject,
      signerName
    );

    this.currentIssuedDocNumber = issueResult.issuedNumber;

    // Save initial document state to lock this number
    const data = this.gatherFormData(false);
    data.id = this.currentEditingDocId || ('doc-' + Date.now());
    data.docNumber = issueResult.issuedNumber;
    data.status = 'issued';

    const saved = window.storage.saveDocument(data);
    this.currentEditingDocId = saved.id;

    // Update UI step progression & badge
    this.updateWorkflowSteps('issued');
    this.updateNextNumberDisplay(saved.docNumber);
    this.updateLivePreview();
    this.playSuccessChime();

    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ลบเอกสารฉบับนี้ทิ้ง';

    this.showToast(`✅ ออกเลขที่เอกสารสำเร็จ: ${saved.docNumber}\nกรุณาพิมพ์เนื้อหา แนบไฟล์ แล้วกด "บันทึกยืนยันเนื้อหา"`, 'success');
  }

  confirmAndPublishDoc() {
    const data = this.gatherFormData(true);
    const compId = data.companyId;
    const docType = data.docType;

    // Determine final official number
    let finalDocNumber = this.currentIssuedDocNumber;

    if (!finalDocNumber && this.currentEditingDocId) {
      const existing = window.storage.getDocument(this.currentEditingDocId);
      if (existing && existing.docNumber && !existing.docNumber.includes('(ฉบับร่าง)')) {
        finalDocNumber = existing.docNumber;
      }
    }

    if (!finalDocNumber) {
      // User directly clicked confirm without issuing beforehand: allocate now
      const issueResult = window.storage.issueRunningNumber(
        compId,
        docType,
        this.currentEditingDocId,
        data.subject,
        data.signerName
      );
      finalDocNumber = issueResult.issuedNumber;
      this.currentIssuedDocNumber = finalDocNumber;
    }

    data.id = this.currentEditingDocId || ('doc-' + Date.now());
    data.docNumber = finalDocNumber;
    data.status = 'published';

    const saved = window.storage.saveDocument(data);
    this.currentEditingDocId = saved.id;

    // IMPORTANT: Preserve dropdown values when presets refresh!
    this.renderPresets(true);
    this.updateWorkflowSteps('confirmed');
    this.updateNextNumberDisplay(saved.docNumber);
    this.updateLivePreview();
    this.playSuccessChime();

    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ลบเอกสารฉบับนี้ทิ้ง';

    // Clear Autosave Draft
    window.storage.clearAutosaveDraft();
    document.getElementById('autosave-restore-banner')?.classList.add('hidden');

    // Auto-sync to Google Sheet / Drive if configured
    const settings = window.storage.getSettings();
    if (settings.webhookUrl) {
      const comp = window.storage.getCompany(compId);
      window.Utils.syncToGoogleDrive(saved, comp, settings).then(res => {
        if (res.success) {
          this.showToast(`บันทึกยืนยันและซิงค์ข้อมูลเข้า Google Sheet เรียบร้อยแล้ว (${saved.docNumber})`, 'success');
        } else {
          this.showToast(`บันทึกในระบบสำเร็จ (Google Sheet ซิงค์ไม่ผ่าน: ${res.error || ''})`, 'info');
        }
      });
    } else {
      this.showToast(`บันทึกยืนยันเนื้อหาเอกสารสำเร็จ: ${saved.docNumber}`, 'success');
    }
  }

  // Backwards compatibility alias
  issueAndPublish() {
    this.confirmAndPublishDoc();
  }

  // =========================================================================
  // Custom Document Number, Restart at 001, and Auto-Gap Sequence Recovery
  // =========================================================================
  openCustomNumberModal() {
    const compId = document.getElementById('form-company-select')?.value || 'twp';
    const docType = document.getElementById('form-doc-type')?.value || 'memo';
    const comp = window.storage.getCompany(compId);

    const compBadge = document.getElementById('custom-num-company-badge');
    if (compBadge) compBadge.textContent = comp.name || comp.code;

    const typeBadge = document.getElementById('custom-num-type-badge');
    const docTypeMap = {
      memo: 'บันทึกข้อความ',
      announcement: 'ประกาศบริษัท',
      salary_cert: 'หนังสือรับรองเงินเดือน',
      work_cert: 'หนังสือรับรองการทำงาน'
    };
    if (typeBadge) typeBadge.textContent = docTypeMap[docType] || docType;

    // Determine current number or auto-gap number
    const input = document.getElementById('custom-num-input');
    if (input) {
      if (this.currentIssuedDocNumber && !this.currentIssuedDocNumber.includes('(ฉบับร่าง)')) {
        input.value = this.currentIssuedDocNumber;
      } else {
        // Suggest lowest missing gap or next sequence
        const autoGapSeq = window.storage.getNextAvailableSequence(compId, docType);
        input.value = window.storage.formatDocNumber(compId, docType, autoGapSeq);
      }
    }

    this.validateCustomNumberInput();
    this.openModal('custom-number-modal');
    if (window.lucide) window.lucide.createIcons();
  }

  validateCustomNumberInput() {
    const input = document.getElementById('custom-num-input');
    const statusBox = document.getElementById('custom-num-status');
    const applyBtn = document.getElementById('btn-apply-custom-number');
    if (!input || !statusBox) return false;

    const val = input.value.trim();
    if (!val) {
      statusBox.className = 'p-3 rounded-2xl text-xs font-medium border bg-amber-50 text-amber-800 border-amber-200';
      statusBox.innerHTML = '⚠️ กรุณาระบุเลขที่เอกสารที่ต้องการ';
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return false;
    }

    const check = window.storage.isDocNumberAvailable(val, this.currentEditingDocId);
    if (!check.available) {
      statusBox.className = 'p-3 rounded-2xl text-xs font-medium border bg-rose-50 text-rose-800 border-rose-200 flex items-center gap-2';
      statusBox.innerHTML = `<span>❌ ${check.message}</span>`;
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return false;
    } else {
      statusBox.className = 'p-3 rounded-2xl text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2';
      statusBox.innerHTML = `<span>✅ เลขที่ <strong>"${val}"</strong> ว่างอยู่ พร้อมใช้งาน (ไม่ซ้ำกับเอกสารอื่นในระบบ)</span>`;
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      return true;
    }
  }

  setCustomNumber001() {
    const compId = document.getElementById('form-company-select')?.value || 'twp';
    const docType = document.getElementById('form-doc-type')?.value || 'memo';
    const num001 = window.storage.formatDocNumber(compId, docType, 1);
    
    const input = document.getElementById('custom-num-input');
    if (input) {
      input.value = num001;
    }
    this.validateCustomNumberInput();
  }

  setCustomNumberAutoGap() {
    const compId = document.getElementById('form-company-select')?.value || 'twp';
    const docType = document.getElementById('form-doc-type')?.value || 'memo';
    const autoSeq = window.storage.getNextAvailableSequence(compId, docType);
    const gapNumber = window.storage.formatDocNumber(compId, docType, autoSeq);

    const input = document.getElementById('custom-num-input');
    if (input) {
      input.value = gapNumber;
    }
    this.validateCustomNumberInput();
  }

  applyCustomDocNumber() {
    const input = document.getElementById('custom-num-input');
    if (!input) return;
    const targetDocNumber = input.value.trim();

    if (!this.validateCustomNumberInput()) {
      alert('เลขที่เอกสารนี้ไม่สามารถใช้ได้ กรุณาตรวจสอบหรือเปลี่ยนเลขอื่น');
      return;
    }

    const compId = document.getElementById('form-company-select')?.value || 'twp';
    const docType = document.getElementById('form-doc-type')?.value || 'memo';
    const subject = document.getElementById('form-subject-input')?.value.trim() || 'ไม่ระบุชื่อเรื่อง';
    const signerName = document.getElementById('form-signer-name-input')?.value.trim() || '';

    // If currently editing an existing document, update its number
    if (this.currentEditingDocId) {
      const res = window.storage.updateDocumentNumber(this.currentEditingDocId, targetDocNumber);
      if (!res.success) {
        alert(res.message);
        return;
      }
      this.currentIssuedDocNumber = targetDocNumber;
    } else {
      // Starting new document with custom number
      const issueRes = window.storage.issueRunningNumber(
        compId,
        docType,
        null,
        subject,
        signerName,
        null,
        targetDocNumber
      );
      this.currentIssuedDocNumber = issueRes.issuedNumber;

      const data = this.gatherFormData(false);
      data.id = 'doc-' + Date.now();
      data.docNumber = issueRes.issuedNumber;
      data.status = 'issued';

      const saved = window.storage.saveDocument(data);
      this.currentEditingDocId = saved.id;
    }

    // Refresh state & UI
    this.updateWorkflowSteps('issued');
    this.updateNextNumberDisplay(targetDocNumber);
    this.updateLivePreview();
    this.closeModal('custom-number-modal');
    this.playSuccessChime();

    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ลบเอกสารฉบับนี้ทิ้ง';

    this.showToast(`✅ กำหนดเลขที่เอกสารสำเร็จ: ${targetDocNumber}`, 'success');
  }

  autoHealAllSequences() {
    window.storage.syncCountersWithExistingDocs();
    if (typeof this.renderRunningLogsView === 'function') {
      this.renderRunningLogsView();
    }
    const compId = document.getElementById('form-company-select')?.value || 'twp';
    const docType = document.getElementById('form-doc-type')?.value || 'memo';
    const nextPreview = window.storage.peekNextNumber(compId, docType);
    this.updateNextNumberDisplay(this.currentIssuedDocNumber || nextPreview);

    this.showToast('✅ ตรวจสอบและซ่อมแซมลำดับ Running Number เรียบร้อยแล้ว (ไม่พบเลขข้ามหรือค้างคา)', 'success');
  }

  saveDraft() {
    const data = this.gatherFormData(false);
    data.id = this.currentEditingDocId || ('doc-' + Date.now());
    data.status = 'draft';
    
    // If it was already published or issued, retain its number
    if (this.currentIssuedDocNumber) {
      data.docNumber = this.currentIssuedDocNumber;
    } else if (this.currentEditingDocId) {
      const existing = window.storage.getDocument(this.currentEditingDocId);
      if (existing && existing.docNumber) {
        data.docNumber = existing.docNumber;
        data.status = existing.status;
      }
    }
    
    if (!data.docNumber) {
      data.docNumber = '(ฉบับร่าง)';
    }

    const saved = window.storage.saveDocument(data);
    this.currentEditingDocId = saved.id;

    // IMPORTANT: Preserve dropdown values!
    this.renderPresets(true);
    this.updateNextNumberDisplay(saved.docNumber);

    const deleteBtnText = document.getElementById('btn-delete-doc-text');
    if (deleteBtnText) deleteBtnText.textContent = 'ลบเอกสารฉบับนี้ทิ้ง';

    // Clear Autosave Draft
    window.storage.clearAutosaveDraft();
    document.getElementById('autosave-restore-banner')?.classList.add('hidden');

    this.showToast('บันทึกฉบับร่างสำเร็จ', 'success');
  }

  updateWorkflowSteps(status) {
    const badge = document.getElementById('workflow-status-badge');
    const step1 = document.getElementById('step-badge-1');
    const step2 = document.getElementById('step-badge-2');
    const step3 = document.getElementById('step-badge-3');
    const btnIssue = document.getElementById('btn-issue-number-first');
    const btnIssueText = document.getElementById('btn-issue-number-first-text');
    const btnConfirm = document.getElementById('btn-confirm-save-doc');
    const btnConfirmText = document.getElementById('btn-confirm-save-doc-text');

    if (!badge || !step1 || !step2 || !step3) return;

    if (status === 'issued') {
      badge.textContent = `สเต็ป 2: ได้เลข ${this.currentIssuedDocNumber || ''} แล้ว (รอพิมพ์และยืนยัน)`;
      badge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';

      step1.className = 'step-badge p-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/50 font-bold text-emerald-300';
      step2.className = 'step-badge p-1.5 rounded-lg bg-sky-500/30 border border-sky-400 font-bold text-white shadow-xs animate-pulse';
      step3.className = 'step-badge p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400';

      if (btnIssueText) btnIssueText.textContent = `✅ ออกเลขที่แล้ว: ${this.currentIssuedDocNumber}`;
      if (btnConfirmText) btnConfirmText.textContent = `💾 บันทึกยืนยันเนื้อหา (${this.currentIssuedDocNumber})`;
    } else if (status === 'confirmed' || status === 'published') {
      badge.textContent = `เสร็จสมบูรณ์: ${this.currentIssuedDocNumber || ''}`;
      badge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';

      step1.className = 'step-badge p-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/50 font-semibold text-emerald-300';
      step2.className = 'step-badge p-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/50 font-semibold text-emerald-300';
      step3.className = 'step-badge p-1.5 rounded-lg bg-emerald-600/40 border border-emerald-400 font-bold text-emerald-200';

      if (btnIssueText) btnIssueText.textContent = `✅ เลขที่ทางการ: ${this.currentIssuedDocNumber || ''}`;
      if (btnConfirmText) btnConfirmText.textContent = `💾 บันทึกการแก้ไข (Update Document)`;
    } else {
      // New / Draft
      badge.textContent = 'สเต็ป 1: ยังไม่ออกเลขที่';
      badge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30';

      step1.className = 'step-badge p-1.5 rounded-lg bg-sky-500/20 border border-sky-400/40 font-semibold text-sky-200';
      step2.className = 'step-badge p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400';
      step3.className = 'step-badge p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400';

      if (btnIssueText) btnIssueText.textContent = '🏷️ ออกเลขที่เอกสารล่วงหน้า (จองเลขทางการทันที)';
      if (btnConfirmText) btnConfirmText.textContent = '💾 บันทึกยืนยันเนื้อหาเอกสาร (Finalize & Confirm)';
    }
  }

  // =========================================================================
  // Attachment Handling with Auto Canvas Compression
  // =========================================================================
  async handleAttachmentUpload(files) {
    if (!files || files.length === 0) return;
    this.showToast(`กำลังบีบอัดและประมวลผลไฟล์แนบ (${files.length} รายการ)...`, 'info');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const processed = await window.Utils.processAttachmentFile(file);
        this.currentAttachments.push(processed);
      } catch (err) {
        alert(err.message || 'เกิดข้อผิดพลาดในการแนบไฟล์');
      }
    }

    this.renderAttachmentsList();
    this.updateLivePreview();
    this.showToast(`แนบไฟล์เรียบร้อยแล้ว (บีบอัดภาพเพื่อประหยัดพื้นที่อัตโนมัติ)`, 'success');
  }

  removeAttachment(attId) {
    this.currentAttachments = this.currentAttachments.filter(a => a.id !== attId);
    this.renderAttachmentsList();
    this.updateLivePreview();
  }

  renderAttachmentsList() {
    const container = document.getElementById('attachments-list-container');
    const badge = document.getElementById('attachments-count-badge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${this.currentAttachments.length} ไฟล์`;
      badge.className = this.currentAttachments.length > 0 
        ? 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300'
        : 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700';
    }

    if (this.currentAttachments.length === 0) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = this.currentAttachments.map(att => {
      const isImg = att.type && att.type.startsWith('image/');
      const originalFmt = window.Utils.formatFileSize(att.originalSize || att.size);
      const compressedFmt = window.Utils.formatFileSize(att.size);
      const savedPercent = att.originalSize && att.originalSize > att.size
        ? Math.round(((att.originalSize - att.size) / att.originalSize) * 100)
        : 0;

      return `
        <div class="flex items-center justify-between p-2.5 bg-white rounded-xl border border-sky-100 shadow-xs hover:border-sky-300 transition group">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                 onclick="window.app.openAttachmentLightbox('${att.id}')">
              ${isImg 
                ? `<img src="${att.dataUrl}" alt="${att.name}" class="w-full h-full object-cover">`
                : `<i data-lucide="file-text" class="w-5 h-5 text-sky-600"></i>`
              }
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-700 cursor-pointer"
                 onclick="window.app.openAttachmentLightbox('${att.id}')" title="${att.name}">
                ${att.name}
              </p>
              <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <span class="font-mono text-emerald-600 font-semibold">${compressedFmt}</span>
                ${savedPercent > 0 ? `<span class="line-through text-slate-300">${originalFmt}</span><span class="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">ลด ${savedPercent}%</span>` : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0 ml-2">
            <button type="button" onclick="window.app.openAttachmentLightbox('${att.id}')" class="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition cursor-pointer" title="ดูตัวอย่าง / ดาวน์โหลด">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="window.app.removeAttachment('${att.id}')" class="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition cursor-pointer" title="ลบไฟล์แนบ">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  openAttachmentLightbox(attId) {
    const att = this.currentAttachments.find(a => a.id === attId) || 
      (this.currentEditingDocId && window.storage.getDocument(this.currentEditingDocId)?.attachments?.find(a => a.id === attId));
    if (!att) return;

    const modal = document.getElementById('attachment-lightbox-modal');
    const title = document.getElementById('lightbox-title');
    const subtitle = document.getElementById('lightbox-subtitle');
    const body = document.getElementById('lightbox-body');
    const downloadBtn = document.getElementById('lightbox-download-btn');

    if (!modal || !body) return;

    if (title) title.textContent = att.name;
    if (subtitle) subtitle.textContent = `ขนาด: ${window.Utils.formatFileSize(att.size)} | ประเภท: ${att.type}`;
    if (downloadBtn) {
      downloadBtn.href = att.dataUrl;
      downloadBtn.download = att.name;
    }

    if (att.type && att.type.startsWith('image/')) {
      body.innerHTML = `
        <div class="max-h-[75vh] flex items-center justify-center p-2 bg-slate-950/20 rounded-2xl">
          <img src="${att.dataUrl}" alt="${att.name}" class="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg">
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div class="w-20 h-20 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
            <i data-lucide="file-check" class="w-10 h-10"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-base">${att.name}</h4>
            <p class="text-xs text-slate-500 mt-1">ไฟล์เอกสารแนบ (${window.Utils.formatFileSize(att.size)})</p>
          </div>
          <a href="${att.dataUrl}" download="${att.name}" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md">
            <i data-lucide="download" class="w-4 h-4"></i>
            ดาวน์โหลดไฟล์ลงเครื่อง
          </a>
        </div>
      `;
    }

    modal.classList.remove('hidden');
    lucide.createIcons();
  }

  deleteCurrentDocument() {
    if (this.currentEditingDocId) {
      const doc = window.storage.getDocument(this.currentEditingDocId);
      const docName = doc ? (doc.docNumber || doc.subject || 'ฉบับนี้') : 'ฉบับนี้';
      const confirmed = confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${docName}" ทิ้ง?\n\nการลบจะไม่สามารถกู้คืนได้`);
      if (confirmed) {
        window.storage.deleteDocument(this.currentEditingDocId);
        this.showToast('ลบเอกสารเรียบร้อยแล้ว', 'info');
        this.resetEditorForm();
        this.navigateTo('archive');
      }
    } else {
      const confirmed = confirm('ต้องการล้างข้อมูลที่กรอกทั้งหมดและเริ่มต้นใหม่ใช่หรือไม่?');
      if (confirmed) {
        this.resetEditorForm();
        this.showToast('ล้างข้อมูลเรียบร้อยแล้ว', 'info');
      }
    }
  }

  // =========================================================================
  // Archive & Search View
  // =========================================================================
  renderArchiveList() {
    this.renderCompanyTabs('archive-company-tabs', this.archiveCompanyFilter, 'setArchiveCompanyFilter');

    const docs = window.storage.getDocuments();
    const companies = window.storage.getCompanies();
    const compMap = Object.fromEntries(companies.map(c => [c.id, c]));

    const searchInput = document.getElementById('archive-search-input')?.value.toLowerCase() || '';
    const companyFilter = this.archiveCompanyFilter || 'all';
    const typeFilter = document.getElementById('archive-filter-type')?.value || 'all';
    const statusFilter = document.getElementById('archive-filter-status')?.value || 'all';

    // Populate filter dropdowns if empty and sync value
    const filterCompEl = document.getElementById('archive-filter-company');
    if (filterCompEl) {
      if (filterCompEl.options.length <= 1) {
        filterCompEl.innerHTML = '<option value="all">🌐 รวมทุกบริษัท (ดูทั้งหมด)</option>' + 
          companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
      filterCompEl.value = companyFilter;
    }

    const filtered = docs.filter(d => {
      const matchComp = companyFilter === 'all' || d.companyId === companyFilter;
      const matchType = typeFilter === 'all' || d.docType === typeFilter;
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const textToSearch = `${d.docNumber || ''} ${d.subject || ''} ${d.signerName || ''} ${d.toRecipient || ''}`.toLowerCase();
      const matchSearch = !searchInput || textToSearch.includes(searchInput);
      return matchComp && matchType && matchStatus && matchSearch;
    });

    const tbody = document.getElementById('archive-table-body');
    const countBadge = document.getElementById('archive-total-count');
    if (countBadge) countBadge.textContent = `${filtered.length} รายการ`;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12 text-slate-400">
            <i class="lucide lucide-inbox w-10 h-10 mx-auto mb-2 opacity-50"></i>
            <p>ไม่พบเอกสารตามเงื่อนไขที่ค้นหา</p>
          </td>
        </tr>
      `;
      return;
    }

    const typeLabels = {
      memo: { label: 'บันทึกภายใน', cls: 'badge-memo' },
      announcement: { label: 'ประกาศ', cls: 'badge-announcement' },
      salary_cert: { label: 'หนังสือรับรองเงินเดือน', cls: 'badge-salary' },
      work_cert: { label: 'หนังสือรับรองการทำงาน', cls: 'badge-work' }
    };

    tbody.innerHTML = filtered.map(d => {
      const comp = compMap[d.companyId] || { name: 'ไม่ระบุ', code: '-' };
      const tInfo = typeLabels[d.docType] || { label: d.docType, cls: 'bg-slate-100 text-slate-700' };
      const thaiDate = window.Utils.formatThaiDateShort(d.date);

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="px-4 py-3 font-semibold text-sky-900">${d.docNumber || '-'}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tInfo.cls}">
              ${tInfo.label}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="font-medium text-slate-800 line-clamp-1" title="${d.subject}">${d.subject || '-'}</div>
            <div class="text-xs text-slate-400">${d.customCompanyName || comp.name}</div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${thaiDate}</td>
          <td class="px-4 py-3 text-sm text-slate-600">${d.signerName || '-'}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${d.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${d.status === 'published' ? 'ออกเลขแล้ว' : 'ฉบับร่าง'}
            </span>
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
            <button onclick="window.app.editDocument('${d.id}')" class="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 rounded font-medium" title="แก้ไข/เปิดดู">
              เปิด/แก้ไข
            </button>
            <button onclick="window.app.quickExportPdf('${d.id}')" class="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 rounded font-medium" title="เปิดดู/พิมพ์ PDF">
              PDF
            </button>
            <button onclick="window.app.quickExportWord('${d.id}')" class="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded" title="ดาวน์โหลด Word">
              Word
            </button>
            <button onclick="window.app.deleteDocConfirm('${d.id}')" class="text-xs text-red-500 hover:text-red-700 px-1 py-1" title="ลบเอกสาร">
              ลบ
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  setArchiveCompanyFilter(companyId) {
    this.archiveCompanyFilter = companyId;
    const filterCompEl = document.getElementById('archive-filter-company');
    if (filterCompEl) {
      filterCompEl.value = companyId;
    }
    this.renderArchiveList();
  }

  editDocument(id) {
    this.navigateTo('editor', id);
  }

  deleteDocConfirm(id) {
    const doc = window.storage.getDocument(id);
    const docName = doc ? (doc.docNumber || doc.subject || 'เอกสารนี้') : 'เอกสารนี้';
    if (confirm(`คุณต้องการลบเอกสาร "${docName}" ใช่หรือไม่? การลบจะไม่สามารถกู้คืนได้`)) {
      window.storage.deleteDocument(id);
      this.renderArchiveList();
      if (typeof this.renderRunningLogsView === 'function') {
        this.renderRunningLogsView();
      }
      if (typeof this.renderDashboardView === 'function') {
        this.renderDashboardView();
      }
      this.showToast('ลบเอกสารเรียบร้อยแล้ว', 'info');
    }
  }

  quickExportPdf(docId) {
    this.openPdfPreviewModal(docId);
  }

  quickExportWord(docId) {
    const doc = window.storage.getDocument(docId);
    if (!doc) {
      this.showToast('ไม่พบเอกสาร', 'error');
      return;
    }
    const comp = window.storage.getCompany(doc.companyId);
    const filename = window.Utils.generateDocFileName(doc, comp, 'doc');
    window.Utils.exportToWord(doc, filename, comp);
  }

  // =========================================================================
  // Running Logs & Audit Trail View
  // =========================================================================
  renderRunningLogsView() {
    this.renderCompanyTabs('running-logs-company-tabs', this.runningLogsCompanyFilter, 'setRunningLogsCompanyFilter');

    const logs = window.storage.getRunningLogs();
    const companies = window.storage.getCompanies();
    const compMap = Object.fromEntries(companies.map(c => [c.id, c]));

    const tbody = document.getElementById('running-logs-table-body');
    if (!tbody) return;

    // Filter logs if runningLogsCompanyFilter !== 'all'
    const filteredLogs = this.runningLogsCompanyFilter === 'all' 
      ? logs 
      : logs.filter(l => l.companyId === this.runningLogsCompanyFilter);

    // Render counters summary cards
    const counters = window.storage.getRunningCounters();
    const summaryContainer = document.getElementById('running-counters-cards');
    if (summaryContainer) {
      const displayCompanies = this.runningLogsCompanyFilter === 'all'
        ? companies
        : companies.filter(c => c.id === this.runningLogsCompanyFilter);

      summaryContainer.innerHTML = displayCompanies.map(c => {
        const cCounts = counters[c.id] || {};
        const total = Object.values(cCounts).reduce((a, b) => a + b, 0);
        return `
          <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div class="flex items-center gap-3 mb-2">
              <img src="${c.logo}" alt="logo" class="h-8 max-w-16 object-contain">
              <div>
                <h4 class="font-bold text-slate-800 text-sm">${c.name}</h4>
                <span class="text-xs text-sky-600 font-semibold">${c.prefix} / ${c.code}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
              <div>บันทึกภายใน: <strong class="text-slate-900">${cCounts.memo || 0}</strong></div>
              <div>ประกาศ: <strong class="text-slate-900">${cCounts.announcement || 0}</strong></div>
              <div>หนังสือรับรองเงินเดือน: <strong class="text-slate-900">${cCounts.salary_cert || 0}</strong></div>
              <div>หนังสือรับรองการทำงาน: <strong class="text-slate-900">${cCounts.work_cert || 0}</strong></div>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 text-right">
              <span class="text-xs text-slate-500">รวมที่ออกทั้งหมด: </span>
              <span class="text-base font-bold text-sky-700">${total}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (filteredLogs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-10 text-slate-400">ยังไม่มีประวัติการออก Running No. สำหรับเงื่อนไขนี้</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredLogs.map(l => {
      const comp = compMap[l.companyId] || { name: 'ไม่ระบุ', code: '-' };
      const dateStr = new Date(l.timestamp).toLocaleString('th-TH');

      return `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
          <td class="px-4 py-3 font-bold text-sky-800">${l.docNumber}</td>
          <td class="px-4 py-3 text-xs text-slate-500">${l.previousNumber || '-'}</td>
          <td class="px-4 py-3 text-xs text-sky-600 font-semibold">${l.nextNumber || '-'}</td>
          <td class="px-4 py-3">
            <div class="text-sm font-medium text-slate-800">${l.subject}</div>
            <div class="text-xs text-slate-400">${comp.name}</div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">${l.issuedBy || '-'}</td>
          <td class="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">${dateStr}</td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              อนุมัติสมบูรณ์
            </span>
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
            ${l.docId ? `
              <button onclick="window.app.editDocument('${l.docId}')" class="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 px-2 py-1 rounded font-medium transition" title="เปิดดู/แก้ไขเอกสารนี้">
                เปิดดู
              </button>
              <button onclick="window.app.quickExportPdf('${l.docId}')" class="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded font-medium transition" title="พิมพ์หรือดาวน์โหลด PDF ทันที">
                PDF
              </button>
            ` : ''}
            <button type="button" onclick="window.app.deleteRunningLogConfirm('${l.id}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded font-medium border border-rose-200 transition cursor-pointer" title="ลบรายการนี้ออกจากทะเบียนคุมและคลังเอกสาร">
              ลบ
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  deleteRunningLogConfirm(logId, docNumber = null) {
    const logs = window.storage.getRunningLogs();
    const targetLog = logs.find(l => l.id === logId);
    const targetDocNum = (targetLog && targetLog.docNumber) ? targetLog.docNumber : (docNumber || 'รายการนี้');

    const confirmed = confirm(
      `คุณต้องการลบประวัติการออกเลขที่ "${targetDocNum}" นี้ออกจากทะเบียนคุมหรือไม่?\n\n` +
      `⚠️ การลบรายการนี้จะลบเอกสารที่เกี่ยวข้องออกจากคลังเอกสารด้วย และไม่สามารถกู้คืนได้`
    );

    if (confirmed) {
      const success = window.storage.deleteRunningLog(logId, true);
      if (success) {
        this.renderRunningLogsView();
        if (typeof this.renderArchiveList === 'function') {
          this.renderArchiveList();
        }
        if (typeof this.renderDashboardView === 'function') {
          this.renderDashboardView();
        }
        this.showToast(`ลบรายการเลขที่ ${targetDocNum} ออกจากทะเบียนคุมเรียบร้อยแล้ว`, 'info');
      } else {
        this.showToast('ไม่สามารถลบรายการได้ หรือไม่พบรายการ', 'error');
      }
    }
  }

  setRunningLogsCompanyFilter(companyId) {
    this.runningLogsCompanyFilter = companyId;
    this.renderRunningLogsView();
  }

  renderCompanyTabs(containerId, activeFilterComp, callbackName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const companies = window.storage.getCompanies();
    const isAll = activeFilterComp === 'all';

    let html = `
      <button type="button" 
        class="company-tab-btn ${isAll ? 'active' : ''}" 
        onclick="window.app.${callbackName}('all')">
        🌐 รวมทุกบริษัท (ดูทั้งหมด)
      </button>
    `;

    companies.forEach(c => {
      const isActive = activeFilterComp === c.id;
      html += `
        <button type="button" 
          class="company-tab-btn ${isActive ? 'active' : ''}" 
          onclick="window.app.${callbackName}('${c.id}')">
          <img src="${c.logo}" alt="logo" class="inline-block h-3.5 w-auto max-w-6 object-contain mr-1.5 align-middle">
          <span>${c.name}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  }

  // =========================================================================
  // Executive Dashboard & Charts
  // =========================================================================
  renderLandingStats() {
    let docs = window.storage.getDocuments();
    const companies = window.storage.getCompanies();

    if (this.activeCompanyId !== 'all') {
      docs = docs.filter(d => d.companyId === this.activeCompanyId);
    }

    const published = docs.filter(d => d.status === 'published');
    const drafts = docs.filter(d => d.status === 'draft');

    const totalEl = document.getElementById('stat-total-docs');
    const pubEl = document.getElementById('stat-published-docs');
    const draftEl = document.getElementById('stat-draft-docs');
    const compEl = document.getElementById('stat-total-companies');

    if (totalEl) totalEl.textContent = docs.length;
    if (pubEl) pubEl.textContent = published.length;
    if (draftEl) draftEl.textContent = drafts.length;
    if (compEl) compEl.textContent = this.activeCompanyId === 'all' ? companies.length : 1;
  }

  renderRecentDocsTable() {
    let docs = window.storage.getDocuments();
    if (this.activeCompanyId !== 'all') {
      docs = docs.filter(d => d.companyId === this.activeCompanyId);
    }
    docs = docs.slice(0, 5);

    const companies = window.storage.getCompanies();
    const compMap = Object.fromEntries(companies.map(c => [c.id, c]));
    const tbody = document.getElementById('landing-recent-table-body');
    if (!tbody) return;

    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">ยังไม่มีเอกสารในระบบสำหรับบริษัทนี้</td></tr>`;
      return;
    }

    tbody.innerHTML = docs.map(d => {
      const comp = compMap[d.companyId] || { name: '-' };
      const thaiDate = window.Utils.formatThaiDateShort(d.date);
      return `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
          <td class="px-4 py-3 font-semibold text-sky-800">${d.docNumber || '-'}</td>
          <td class="px-4 py-3 font-medium text-slate-800">${d.subject}</td>
          <td class="px-4 py-3 text-xs text-slate-500">${d.customCompanyName || comp.name}</td>
          <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${thaiDate}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap space-x-1">
            <button onclick="window.app.editDocument('${d.id}')" class="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 rounded font-medium">
              เปิดดู
            </button>
            <button onclick="window.app.quickExportPdf('${d.id}')" class="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded font-medium">
              PDF
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderDashboard() {
    const docs = window.storage.getDocuments();
    const companies = window.storage.getCompanies();

    // KPI Metrics
    document.getElementById('dash-kpi-total').textContent = docs.length;
    document.getElementById('dash-kpi-published').textContent = docs.filter(d => d.status === 'published').length;
    document.getElementById('dash-kpi-draft').textContent = docs.filter(d => d.status === 'draft').length;
    document.getElementById('dash-kpi-companies').textContent = companies.length;

    if (!window.Chart) return;

    // Destroy prior charts to avoid canvas reuse issues
    if (this.chartInstances.companyChart) this.chartInstances.companyChart.destroy();
    if (this.chartInstances.typeChart) this.chartInstances.typeChart.destroy();
    if (this.chartInstances.monthChart) this.chartInstances.monthChart.destroy();

    // 1. Company Distribution Chart
    const compCtx = document.getElementById('chart-company')?.getContext('2d');
    if (compCtx) {
      const compLabels = companies.map(c => c.name);
      const compData = companies.map(c => docs.filter(d => d.companyId === c.id).length);

      this.chartInstances.companyChart = new Chart(compCtx, {
        type: 'bar',
        data: {
          labels: compLabels,
          datasets: [{
            label: 'จำนวนเอกสาร (ฉบับ)',
            data: compData,
            backgroundColor: ['#0284c7', '#0f766e', '#0369a1'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    // 2. Document Type Chart
    const typeCtx = document.getElementById('chart-types')?.getContext('2d');
    if (typeCtx) {
      const typeCounts = {
        'บันทึกภายใน': docs.filter(d => d.docType === 'memo').length,
        'ประกาศ': docs.filter(d => d.docType === 'announcement').length,
        'หนังสือรับรองเงินเดือน': docs.filter(d => d.docType === 'salary_cert').length,
        'หนังสือรับรองการทำงาน': docs.filter(d => d.docType === 'work_cert').length
      };

      this.chartInstances.typeChart = new Chart(typeCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(typeCounts),
          datasets: [{
            data: Object.values(typeCounts),
            backgroundColor: ['#38bdf8', '#fbbf24', '#4ade80', '#c084fc']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // 3. Monthly Trend Chart
    const monthCtx = document.getElementById('chart-monthly')?.getContext('2d');
    if (monthCtx) {
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthData = new Array(12).fill(0);

      docs.forEach(d => {
        if (d.date) {
          const m = new Date(d.date).getMonth();
          if (m >= 0 && m < 12) monthData[m]++;
        }
      });

      this.chartInstances.monthChart = new Chart(monthCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'เอกสารที่ออกรายเดือน',
            data: monthData,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0284c7'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  // =========================================================================
  // Signature Pad Integration
  // =========================================================================
  setupSignaturePad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasDrawn = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      hasDrawn = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = (e) => {
      if (isDrawing) {
        ctx.closePath();
        isDrawing = false;
      }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // Clear Button
    document.getElementById('sig-clear-btn')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn = false;
    });

    // Apply Button
    document.getElementById('sig-apply-btn')?.addEventListener('click', () => {
      if (hasDrawn) {
        this.signatureDataUrl = canvas.toDataURL('image/png');
        this.closeModal('signature-modal');
        this.updateLivePreview();
        this.showToast('เพิ่มลายเซ็นในเอกสารแล้ว', 'success');
      } else {
        alert('กรุณาวาดลายเซ็นบนช่องก่อนกดยืนยัน');
      }
    });

    // File Upload for Signature
    document.getElementById('sig-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.signatureDataUrl = evt.target.result;
          this.closeModal('signature-modal');
          this.updateLivePreview();
          this.showToast('อัปโหลดรูปลายเซ็นเรียบร้อยแล้ว', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  openSignatureModal() {
    this.openModal('signature-modal');
    // Clear canvas for new drawing
    const canvas = document.getElementById('sig-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  clearSignatureFromDoc() {
    this.signatureDataUrl = '';
    this.updateLivePreview();
    this.showToast('ลบลายเซ็นออกจากเอกสารแล้ว', 'info');
  }

  // =========================================================================
  // Rich Text Simple Toolbar
  // =========================================================================
  initRichEditor() {
    const editor = document.getElementById('rich-content-editor');
    if (!editor) return;

    editor.addEventListener('input', () => {
      this.updateLivePreview();
    });

    document.querySelectorAll('.editor-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        document.execCommand(cmd, false, val);
        editor.focus();
        this.updateLivePreview();
      });
    });
  }

  // =========================================================================
  // Settings & PIN Protection (`memoadmin`)
  // =========================================================================
  openSettingsModal() {
    if (this.isAdminAuthenticated) {
      this.showSettingsContent();
    } else {
      this.openModal('settings-pin-modal');
      const pinInput = document.getElementById('settings-pin-input');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  verifyAdminPin() {
    const input = document.getElementById('settings-pin-input');
    const pin = input ? input.value : '';

    if (window.storage.verifyAdminPin(pin)) {
      this.isAdminAuthenticated = true;
      this.closeModal('settings-pin-modal');
      this.showSettingsContent();
      this.showToast('เข้าสู่ระบบจัดการสำเร็จ', 'success');
    } else {
      alert('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      if (input) input.focus();
    }
  }

  showSettingsContent() {
    this.openModal('settings-main-modal');
    this.renderSettingsTabs();
  }

  renderSettingsTabs() {
    // 1. Companies Tab
    const companies = window.storage.getCompanies();
    const compTable = document.getElementById('settings-companies-list');
    if (compTable) {
      compTable.innerHTML = companies.map(c => `
        <div class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 transition rounded-xl border border-slate-200">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-14 h-11 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
              <img src="${c.logo}" class="max-h-full max-w-full object-contain">
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-sm truncate">${c.name}</p>
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-0.5">
                <span>รหัส: <strong>${c.code}</strong></span>
                <span>•</span>
                <span>คำนำหน้า: <strong>${c.prefix}</strong></span>
                <span>•</span>
                <span class="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">
                  เลขผู้เสียภาษี: ${c.taxId || 'ยังไม่ระบุ'}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 truncate">${c.address || 'ไม่ระบุที่อยู่'} | โทร: ${c.tel || '-'}</p>
            </div>
          </div>
          <button onclick="window.app.openCompanyEditModal('${c.id}')" class="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs shrink-0 transition flex items-center gap-1.5">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            <span>แก้ไข / เลขภาษี</span>
          </button>
        </div>
      `).join('');
    }

    // 2. Presets Tab
    const posList = window.storage.getPositions();
    const posContainer = document.getElementById('settings-positions-chips');
    if (posContainer) {
      posContainer.innerHTML = posList.map(p => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-200 text-slate-800">
          ${p}
          <button type="button" onclick="window.app.removePreset('positions', '${p}')" class="text-slate-500 hover:text-red-600 font-bold">&times;</button>
        </span>
      `).join('');
    }

    // 3. Settings Configs Tab
    const settings = window.storage.getSettings();
    document.getElementById('settings-drive-url').value = settings.driveUrl;
    document.getElementById('settings-drive-id').value = settings.driveFolderId;
    document.getElementById('settings-drive-email').value = settings.driveEmail;
    document.getElementById('settings-webhook-url').value = settings.webhookUrl || '';
    const sheetUrlInput = document.getElementById('settings-sheet-url');
    if (sheetUrlInput) {
      sheetUrlInput.value = settings.sheetUrl || '';
    }
    const autoSyncCheckbox = document.getElementById('settings-auto-sync');
    if (autoSyncCheckbox) {
      autoSyncCheckbox.checked = settings.autoSyncDrive !== false;
    }
  }

  saveGlobalSettings() {
    const settings = window.storage.getSettings();
    settings.driveUrl = document.getElementById('settings-drive-url').value.trim();
    settings.driveFolderId = document.getElementById('settings-drive-id').value.trim();
    settings.driveEmail = document.getElementById('settings-drive-email').value.trim();
    settings.webhookUrl = document.getElementById('settings-webhook-url').value.trim();
    const sheetUrlInput = document.getElementById('settings-sheet-url');
    if (sheetUrlInput) {
      settings.sheetUrl = sheetUrlInput.value.trim();
    }
    const autoSyncCheckbox = document.getElementById('settings-auto-sync');
    if (autoSyncCheckbox) {
      settings.autoSyncDrive = autoSyncCheckbox.checked;
    }

    window.storage.saveSettings(settings);
    this.closeModal('settings-main-modal');
    this.showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');
  }

  async testGoogleAppsScriptConnection() {
    const url = document.getElementById('settings-webhook-url')?.value.trim();
    if (!url) {
      alert('กรุณากรอก Google Apps Script Webhook URL ในช่องด้านบนก่อนกดทดสอบ');
      return;
    }

    this.showToast('กำลังทดสอบการเชื่อมต่อ Google Sheet & Apps Script...', 'info');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'test_connection' })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ การเชื่อมต่อสำเร็จสมบูรณ์!\n\nผลลัพธ์: ${data.message || ''}\nSpreadsheet: ${data.spreadsheetName || '-'}\nSheet Tab: ${data.sheetName || '-'}`);
        this.showToast('เชื่อมต่อ Google Sheet สำเร็จสมบูรณ์', 'success');
      } else {
        alert('⚠️ ได้รับผลลัพธ์จากเซิร์ฟเวอร์: ' + (data.message || data.error || 'สถานะไม่สำเร็จ'));
      }
    } catch (e) {
      try {
        const getRes = await fetch(url);
        const getData = await getRes.json();
        if (getData.status === 'online') {
          alert(`✅ การเชื่อมต่อ Webhook สำเร็จ!\nระบบ: ${getData.system}\nTarget Folder: ${getData.targetFolderId}`);
          this.showToast('เชื่อมต่อ Google Apps Script สำเร็จ', 'success');
          return;
        }
      } catch (e2) {}
      alert(`⚠️ ได้ส่งคำขอไปยัง Webhook แล้ว (${e.message})\n\nคำแนะนำ:\n1. ตรวจสอบว่าใน Apps Script ได้กด Deploy > Web app > Who has access เป็น "Anyone" หรือไม่\n2. ตรวจสอบว่า URL ลงท้ายด้วย /exec หรือไม่`);
    }
  }

  // =========================================================================
  // Google Sheets Memo List Central Viewer Modal
  // =========================================================================
  openGoogleSheetModal() {
    const settings = window.storage.getSettings();
    const sheetUrl = settings.sheetUrl || 'https://docs.google.com/spreadsheets/d/1JpBrTgqbM0VbRTVPbDFwkY2__W1AkLSxtljKJs_4Xl8/edit?gid=0#gid=0';
    
    // For embedding inside modal iframe:
    let embedUrl = sheetUrl;
    if (embedUrl.includes('/edit')) {
      embedUrl = embedUrl.replace(/\/edit.*$/, '/htmlembed?widget=true&headers=false');
    }

    const iframe = document.getElementById('google-sheet-iframe');
    if (iframe) {
      if (iframe.src !== embedUrl) {
        iframe.src = embedUrl;
      }
    }

    const extLink = document.getElementById('btn-open-sheet-external');
    if (extLink) {
      extLink.href = sheetUrl;
    }

    this.openModal('google-sheet-viewer-modal');
    this.showToast('เปิดสมุดทะเบียนคุม Google Sheets', 'info');
  }

  refreshGoogleSheetFrame() {
    const iframe = document.getElementById('google-sheet-iframe');
    if (iframe) {
      const src = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = src;
      }, 150);
      this.showToast('กำลังรีเฟรชข้อมูล Google Sheet...', 'info');
    }
  }

  openGoogleSheetDirect() {
    const settings = window.storage.getSettings();
    const sheetUrl = settings.sheetUrl || 'https://docs.google.com/spreadsheets/d/1JpBrTgqbM0VbRTVPbDFwkY2__W1AkLSxtljKJs_4Xl8/edit?gid=0#gid=0';
    window.open(sheetUrl, '_blank', 'noopener,noreferrer');
  }

  openCompanyEditModal(companyId = null) {
    const titleEl = document.getElementById('company-modal-title');
    const idInput = document.getElementById('modal-comp-id');
    const nameInput = document.getElementById('modal-comp-name');
    const codeInput = document.getElementById('modal-comp-code');
    const prefixInput = document.getElementById('modal-comp-prefix');
    const taxIdInput = document.getElementById('modal-comp-taxid');
    const telInput = document.getElementById('modal-comp-tel');
    const addrInput = document.getElementById('modal-comp-address');
    const logoPreview = document.getElementById('modal-comp-logo-preview');

    if (companyId) {
      const comp = window.storage.getCompany(companyId);
      if (titleEl) {
        const span = titleEl.querySelector('span');
        if (span) span.textContent = `แก้ไขข้อมูลบริษัทและเลขภาษี: ${comp.name}`;
      }
      if (idInput) idInput.value = comp.id;
      if (nameInput) nameInput.value = comp.name;
      if (codeInput) codeInput.value = comp.code;
      if (prefixInput) prefixInput.value = comp.prefix;
      if (taxIdInput) taxIdInput.value = comp.taxId || '';
      if (telInput) telInput.value = comp.tel || '';
      if (addrInput) addrInput.value = comp.address || '';
      if (logoPreview) logoPreview.src = comp.logo || 'assets/images/twp_logo.png';
      this.modalCompanyLogoDataUrl = comp.logo || '';
    } else {
      if (titleEl) {
        const span = titleEl.querySelector('span');
        if (span) span.textContent = 'เพิ่มบริษัทใหม่และกำหนดเลขผู้เสียภาษี';
      }
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (codeInput) codeInput.value = '';
      if (prefixInput) prefixInput.value = '';
      if (taxIdInput) taxIdInput.value = '';
      if (telInput) telInput.value = '';
      if (addrInput) addrInput.value = '';
      if (logoPreview) logoPreview.src = 'assets/images/twp_logo.png';
      this.modalCompanyLogoDataUrl = 'assets/images/twp_logo.png';
    }

    this.openModal('company-edit-modal');
    if (window.lucide) window.lucide.createIcons();
  }

  saveCompanyFromModal() {
    const id = document.getElementById('modal-comp-id')?.value.trim();
    const name = document.getElementById('modal-comp-name')?.value.trim();
    const code = (document.getElementById('modal-comp-code')?.value.trim() || 'NEW').toUpperCase();
    const prefix = document.getElementById('modal-comp-prefix')?.value.trim() || code;
    const taxId = document.getElementById('modal-comp-taxid')?.value.trim() || '';
    const tel = document.getElementById('modal-comp-tel')?.value.trim() || '';
    const address = document.getElementById('modal-comp-address')?.value.trim() || '';
    const logo = this.modalCompanyLogoDataUrl || 'assets/images/twp_logo.png';

    if (!name) {
      alert('กรุณากรอกชื่อบริษัท');
      document.getElementById('modal-comp-name')?.focus();
      return;
    }

    if (id) {
      const comp = window.storage.getCompany(id);
      comp.name = name;
      comp.code = code;
      comp.prefix = prefix;
      comp.taxId = taxId;
      comp.tel = tel;
      comp.address = address;
      if (this.modalCompanyLogoDataUrl) comp.logo = this.modalCompanyLogoDataUrl;
      window.storage.saveCompany(comp);
      this.showToast(`บันทึกข้อมูลและเลขผู้เสียภาษีของ "${name}" เรียบร้อยแล้ว`, 'success');
    } else {
      const newComp = {
        id: 'comp-' + Date.now(),
        name,
        code,
        prefix,
        taxId: taxId || '0100000000000',
        tel,
        address,
        logo
      };
      window.storage.saveCompany(newComp);
      this.showToast(`เพิ่มบริษัท "${name}" พร้อมเลขผู้เสียภาษีเรียบร้อยแล้ว`, 'success');
    }

    this.closeModal('company-edit-modal');
    this.renderSettingsTabs();
    this.renderCompanySelector();

    // If currently in editor, sync inputs if editing active company
    if (this.currentView === 'editor') {
      const currentSelectedComp = document.getElementById('form-company-select')?.value;
      if (currentSelectedComp === id || !id) {
        this.changeActiveCompany(id || window.storage.getActiveCompanyId());
      }
    } else if (this.currentView === 'archive') {
      this.renderArchiveList();
    } else if (this.currentView === 'running-logs') {
      this.renderRunningLogsView();
    }
  }

  addCompanyPrompt() {
    this.openCompanyEditModal(null);
  }

  editCompanyPrompt(id) {
    this.openCompanyEditModal(id);
  }

  addPresetPrompt(type) {
    const text = prompt('ระบุรายการที่ต้องการเพิ่ม:');
    if (!text || !text.trim()) return;

    if (type === 'positions') {
      window.storage.addPosition(text.trim());
    } else if (type === 'recipients') {
      window.storage.addRecipient(text.trim());
    }
    this.renderSettingsTabs();
    this.renderPresets();
    this.showToast('เพิ่มรายการเรียบร้อยแล้ว', 'success');
  }

  removePreset(type, val) {
    if (!confirm(`คุณต้องการลบ "${val}" ใช่หรือไม่?`)) return;

    if (type === 'positions') {
      let list = window.storage.getPositions().filter(p => p !== val);
      window.storage.set(STORAGE_KEYS.POSITIONS, list);
    }
    this.renderSettingsTabs();
    this.renderPresets();
    this.showToast('ลบรายการเรียบร้อยแล้ว', 'info');
  }

  // =========================================================================
  // Google Drive & Email Export Actions
  // =========================================================================
  async triggerGoogleDriveSync() {
    const data = this.gatherFormData(false);
    const company = window.storage.getCompany(data.companyId);
    const settings = window.storage.getSettings();

    this.showToast('กำลังเตรียมข้อมูลส่งไปยัง Google Drive...', 'info');

    const result = await window.Utils.syncToGoogleDrive(data, company, settings);
    if (result.success) {
      this.showToast('ส่งเอกสารไปยัง Google Drive สำเร็จแล้ว', 'success');
    } else if (!result.manual) {
      this.showToast('ไม่สามารถส่งผ่าน Webhook ได้ เปิดโฟลเดอร์ให้แทน', 'info');
      window.open(settings.driveUrl, '_blank');
    }
  }

  openGoogleDriveFolder() {
    const settings = window.storage.getSettings();
    window.open(settings.driveUrl, '_blank');
  }

  openEmailModal() {
    const data = this.gatherFormData(false);
    document.getElementById('email-subject-input').value = `[เอกสารทางการ] ${data.subject}`;
    document.getElementById('email-body-input').value = `เรียน ท่านที่เกี่ยวข้อง\n\nขอส่งเอกสาร ${data.subject} ตามที่แนบมานี้\n\nสามารถเปิดดูเอกสารใน Google Drive ได้ที่:\n${window.storage.getSettings().driveUrl}\n\nขอแสดงความนับถือ\n${data.signerName || ''}\n${data.signerPosition || ''}`;
    this.openModal('email-modal');
  }

  sendEmailAction() {
    const to = document.getElementById('email-to-input').value.trim();
    const subject = document.getElementById('email-subject-input').value.trim();
    const body = document.getElementById('email-body-input').value.trim();

    if (!to) {
      alert('กรุณาระบุอีเมลผู้รับ');
      return;
    }

    window.Utils.composeEmail(to, subject, body);
    this.closeModal('email-modal');
    this.showToast('เปิดโปรแกรมส่งอีเมลแล้ว', 'success');
  }

  // =========================================================================
  // Template & Past Memo Import with Live Preview
  // =========================================================================
  openTemplateImportModal() {
    this.currentImportTab = 'templates';
    this.selectedImportId = null;
    this.selectedImportType = null;
    this.updateImportTabsUI();
    this.renderImportItemsList();
    this.openModal('template-import-modal');

    // Auto-select first template
    const tpls = window.storage.getTemplates();
    if (tpls && tpls.length > 0) {
      this.selectImportItem('template', tpls[0].id);
    }
  }

  switchImportTab(tab) {
    this.currentImportTab = tab;
    this.updateImportTabsUI();
    this.renderImportItemsList();
    if (tab === 'templates') {
      const tpls = window.storage.getTemplates();
      if (tpls && tpls.length > 0) this.selectImportItem('template', tpls[0].id);
    } else {
      const docs = window.storage.getDocuments().filter(d => d.docType === 'memo' || !d.docType);
      if (docs && docs.length > 0) this.selectImportItem('memo', docs[0].id);
      else this.renderEmptyImportPreview();
    }
  }

  updateImportTabsUI() {
    const tabTpl = document.getElementById('tab-import-templates');
    const tabPast = document.getElementById('tab-import-past-memos');
    if (this.currentImportTab === 'templates') {
      tabTpl?.classList.add('border-sky-600', 'text-sky-600');
      tabTpl?.classList.remove('border-transparent', 'text-slate-500');
      tabPast?.classList.remove('border-sky-600', 'text-sky-600');
      tabPast?.classList.add('border-transparent', 'text-slate-500');
    } else {
      tabPast?.classList.add('border-sky-600', 'text-sky-600');
      tabPast?.classList.remove('border-transparent', 'text-slate-500');
      tabTpl?.classList.remove('border-sky-600', 'text-sky-600');
      tabTpl?.classList.add('border-transparent', 'text-slate-500');
    }
  }

  renderImportItemsList() {
    const container = document.getElementById('template-items-scroll-list');
    const search = document.getElementById('template-search-input')?.value.toLowerCase().trim() || '';
    if (!container) return;

    if (this.currentImportTab === 'templates') {
      let tpls = window.storage.getTemplates();
      if (search) {
        tpls = tpls.filter(t => t.name.toLowerCase().includes(search) || (t.category && t.category.toLowerCase().includes(search)) || (t.subject && t.subject.toLowerCase().includes(search)));
      }
      if (tpls.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">ไม่พบแม่แบบที่ค้นหา</div>`;
        return;
      }
      container.innerHTML = tpls.map(t => `
        <div class="template-item-card ${this.selectedImportId === t.id ? 'active' : ''}" data-type="template" data-id="${t.id}" onclick="window.app.selectImportItem('template', '${t.id}')">
          <div class="flex items-start gap-2.5">
            <span class="text-xl shrink-0">${t.icon || '📄'}</span>
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded">${t.category}</span>
              <h5 class="text-xs font-bold text-slate-800 mt-1 truncate">${t.name}</h5>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">${t.subject}</p>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      let docs = window.storage.getDocuments();
      if (search) {
        docs = docs.filter(d => (d.subject && d.subject.toLowerCase().includes(search)) || (d.docNumber && d.docNumber.toLowerCase().includes(search)));
      }
      if (docs.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">ไม่พบบันทึกข้อความเดิม</div>`;
        return;
      }
      container.innerHTML = docs.map(d => {
        const comp = window.storage.getCompany(d.companyId);
        return `
          <div class="template-item-card ${this.selectedImportId === d.id ? 'active' : ''}" data-type="memo" data-id="${d.id}" onclick="window.app.selectImportItem('memo', '${d.id}')">
            <div class="flex items-start gap-2.5">
              <span class="text-xl shrink-0">📑</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">${d.docNumber || 'ฉบับร่าง'}</span>
                  <span class="text-[10px] text-slate-400">${d.date || ''}</span>
                </div>
                <h5 class="text-xs font-bold text-slate-800 mt-1 truncate">${d.subject || 'ไม่ระบุชื่อเรื่อง'}</h5>
                <p class="text-[11px] text-slate-500 truncate mt-0.5">${comp ? comp.name : ''}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  selectImportItem(type, id) {
    this.selectedImportType = type;
    this.selectedImportId = id;

    // Highlight in left list
    document.querySelectorAll('.template-item-card').forEach(card => {
      if (card.dataset.id === id && card.dataset.type === type) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    const previewTarget = document.getElementById('template-preview-container');
    const tip = document.getElementById('template-preview-status-tip');
    if (!previewTarget) return;

    if (type === 'template') {
      const tpl = window.storage.getTemplate(id);
      if (!tpl) return;
      if (tip) tip.textContent = `กำลังแสดงตัวอย่างแม่แบบ: "${tpl.name}"`;

      const comp = window.storage.getCompany(this.activeCompanyId) || window.storage.getCompanies()[0];
      const mockDoc = {
        companyId: comp.id,
        docType: 'memo',
        headerTitle: 'บันทึกภายใน',
        date: new Date().toISOString().split('T')[0],
        subject: tpl.subject,
        toRecipient: tpl.toRecipient,
        closing: tpl.closing,
        content: tpl.content,
        signerName: document.getElementById('form-signer-name-input')?.value.trim() || 'นิพนธ์ ศรแก้ว',
        signerPosition: document.getElementById('form-signer-position-select')?.value || 'ผู้จัดการทั่วไป',
        showFooter: false
      };
      previewTarget.innerHTML = this.buildDocHtml(mockDoc);
    } else {
      const doc = window.storage.getDocument(id);
      if (!doc) return;
      if (tip) tip.textContent = `กำลังแสดงตัวอย่างบันทึกเดิม: "${doc.docNumber || 'ฉบับร่าง'}" - ${doc.subject}`;
      previewTarget.innerHTML = this.buildDocHtml(doc);
    }
  }

  renderEmptyImportPreview() {
    const previewTarget = document.getElementById('template-preview-container');
    if (previewTarget) {
      previewTarget.innerHTML = `<div class="p-12 text-center text-slate-400">ยังไม่มีบันทึกเดิมในระบบ</div>`;
    }
  }

  applyImportContentOnly() {
    if (!this.selectedImportId || !this.selectedImportType) {
      this.showToast('กรุณาเลือกรายการที่ต้องการนำเข้าก่อน', 'warning');
      return;
    }
    let content = '';
    if (this.selectedImportType === 'template') {
      const tpl = window.storage.getTemplate(this.selectedImportId);
      if (tpl) content = tpl.content;
    } else {
      const doc = window.storage.getDocument(this.selectedImportId);
      if (doc) content = doc.content;
    }

    if (!content) {
      this.showToast('ไม่พบเนื้อหาในรายการที่เลือก', 'warning');
      return;
    }

    const editor = document.getElementById('rich-content-editor');
    if (editor) {
      const current = editor.innerHTML.trim();
      if (!current || current === '<p>มีความประสงค์ขออนุมัติดำเนินการ...</p>' || current === '<p><br></p>') {
        editor.innerHTML = content;
      } else {
        editor.innerHTML = current + '<br>' + content;
      }
    }

    this.closeModal('template-import-modal');
    this.updateLivePreview();
    this.showToast('แทรกเนื้อหาและตารางสำเร็จแล้ว', 'success');
  }

  applyImportFull() {
    if (!this.selectedImportId || !this.selectedImportType) {
      this.showToast('กรุณาเลือกรายการที่ต้องการนำเข้าก่อน', 'warning');
      return;
    }

    if (this.selectedImportType === 'template') {
      const tpl = window.storage.getTemplate(this.selectedImportId);
      if (!tpl) return;
      document.getElementById('form-subject-input').value = tpl.subject || '';
      if (tpl.toRecipient) {
        const recSelect = document.getElementById('form-recipient-select');
        if (recSelect) {
          let matched = false;
          for (let opt of recSelect.options) {
            if (opt.value === tpl.toRecipient) {
              recSelect.value = tpl.toRecipient;
              matched = true;
              break;
            }
          }
          if (!matched) {
            recSelect.value = '__custom__';
            const cust = document.getElementById('form-recipient-custom');
            if (cust) {
              cust.value = tpl.toRecipient;
              document.getElementById('form-recipient-custom-group')?.classList.remove('hidden');
            }
          }
        }
      }
      if (tpl.closing) {
        const closeSelect = document.getElementById('form-closing-select');
        if (closeSelect) {
          let matched = false;
          for (let opt of closeSelect.options) {
            if (opt.value === tpl.closing) {
              closeSelect.value = tpl.closing;
              matched = true;
              break;
            }
          }
          if (!matched) {
            closeSelect.value = '__custom__';
            const cust = document.getElementById('form-closing-custom');
            if (cust) {
              cust.value = tpl.closing;
              document.getElementById('form-closing-custom-group')?.classList.remove('hidden');
            }
          }
        }
      }
      const editor = document.getElementById('rich-content-editor');
      if (editor) editor.innerHTML = tpl.content || '';
    } else {
      const doc = window.storage.getDocument(this.selectedImportId);
      if (!doc) return;
      document.getElementById('form-subject-input').value = doc.subject || '';
      if (doc.toRecipient) {
        const recSelect = document.getElementById('form-recipient-select');
        if (recSelect) recSelect.value = doc.toRecipient;
      }
      if (doc.closing) {
        const closeSelect = document.getElementById('form-closing-select');
        if (closeSelect) closeSelect.value = doc.closing;
      }
      if (doc.signerName) {
        document.getElementById('form-signer-name-input').value = doc.signerName;
      }
      if (doc.signerPosition) {
        document.getElementById('form-signer-position-select').value = doc.signerPosition;
      }
      const editor = document.getElementById('rich-content-editor');
      if (editor) editor.innerHTML = doc.content || '';
    }

    this.closeModal('template-import-modal');
    this.updateLivePreview();
    this.showToast('นำเข้าข้อมูลสำเร็จแล้ว', 'success');
  }

  // =========================================================================
  // Editor Formatting, Table & Image Insertion Helpers
  // =========================================================================
  insertTableToEditor() {
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:14px 0;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:50px;">ลำดับ</th>
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">รายการ / รายละเอียด</th>
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:80px;">จำนวน</th>
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:110px;">ราคา/หน่วย</th>
            <th style="border:1px solid #cbd5e1; padding:8px; text-align:right; width:120px;">ราคารวม (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
            <td style="border:1px solid #cbd5e1; padding:8px;">ระบุรายการที่ต้องการ...</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">0.00</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">0.00</td>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">2</td>
            <td style="border:1px solid #cbd5e1; padding:8px;">ระบุรายการที่ต้องการ...</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">1</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">0.00</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">0.00</td>
          </tr>
          <tr style="font-weight:bold; background:#f8fafc;">
            <td colspan="4" style="border:1px solid #cbd5e1; padding:8px; text-align:right;">รวมเป็นเงินทั้งสิ้น</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:right;">0.00</td>
          </tr>
        </tbody>
      </table><p></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    this.updateLivePreview();
  }

  async handleEditorImageUpload(file) {
    if (!file) return;
    try {
      const compressed = await window.Utils.compressImage(file, 800, 0.85);
      const imgHtml = `<p><img src="${compressed}" style="max-width:100%; height:auto; border-radius:4px; margin:12px auto; display:block;" alt="ภาพประกอบ"></p><p></p>`;
      document.execCommand('insertHTML', false, imgHtml);
      this.updateLivePreview();
      this.showToast('แทรกรูปภาพเรียบร้อยแล้ว', 'success');
    } catch (err) {
      this.showToast('ไม่สามารถแทรกรูปภาพได้: ' + err.message, 'error');
    }
  }

  cleanEditorFormatting() {
    const editor = document.getElementById('rich-content-editor');
    if (!editor) return;
    let html = editor.innerHTML;
    html = html.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');
    html = html.replace(/font-family:[^;]+;/gi, '');
    html = html.replace(/font-size:[^;]+;/gi, '');
    html = html.replace(/color:[^;]+;/gi, '');
    editor.innerHTML = html;
    this.updateLivePreview();
    this.showToast('ล้างฟอร์แมตแปลกปลอมเรียบร้อยแล้ว', 'info');
  }

  // =========================================================================
  // Modal Helpers
  // =========================================================================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      if (modalId === 'pdf-preview-modal') {
        document.body.classList.add('pdf-modal-open');
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      if (modalId === 'pdf-preview-modal') {
        document.body.classList.remove('pdf-modal-open');
      }
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      info: 'bg-slate-800 text-white'
    };

    toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all transform duration-300 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // =========================================================================
  // DOM Event Listeners Binding
  // =========================================================================
  bindEvents() {
    // Navigation Items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const view = el.dataset.view;
        if (window.innerWidth < 1024) {
          document.getElementById('sidebar')?.classList.remove('mobile-open');
        }
        if (view) this.navigateTo(view);
      });
    });

    // Company Settings Collapsible Header Toggle
    document.getElementById('btn-toggle-company-settings')?.addEventListener('click', () => {
      const content = document.getElementById('company-settings-content');
      const chevron = document.getElementById('company-settings-chevron');
      const badge = document.getElementById('company-settings-badge');
      if (content) {
        const isHidden = content.classList.contains('hidden');
        if (isHidden) {
          content.classList.remove('hidden');
          chevron?.classList.add('rotate-180');
          if (badge) badge.textContent = 'ซ่อนรายละเอียด';
        } else {
          content.classList.add('hidden');
          chevron?.classList.remove('rotate-180');
          if (badge) badge.textContent = 'แก้ไขโลโก้/ที่อยู่';
        }
      }
    });

    // Footer Toggle Live Refresh
    document.getElementById('form-show-footer-toggle')?.addEventListener('change', () => {
      this.updateLivePreview();
    });

    // Template & Past Memo Import Modal
    document.getElementById('btn-open-template-import')?.addEventListener('click', () => this.openTemplateImportModal());
    document.getElementById('tab-import-templates')?.addEventListener('click', () => this.switchImportTab('templates'));
    document.getElementById('tab-import-past-memos')?.addEventListener('click', () => this.switchImportTab('past-memos'));
    document.getElementById('template-search-input')?.addEventListener('input', () => this.renderImportItemsList());
    document.getElementById('btn-apply-import-content-only')?.addEventListener('click', () => this.applyImportContentOnly());
    document.getElementById('btn-apply-import-full')?.addEventListener('click', () => this.applyImportFull());

    // Editor Table & Inline Image & Format Tools
    document.getElementById('btn-editor-insert-table')?.addEventListener('click', () => this.insertTableToEditor());
    document.getElementById('editor-image-file-input')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleEditorImageUpload(e.target.files[0]);
        e.target.value = '';
      }
    });
    document.getElementById('btn-editor-clean-format')?.addEventListener('click', () => this.cleanEditorFormatting());

    // Autosave Draft Banner Action Buttons
    document.getElementById('btn-restore-autosave-draft')?.addEventListener('click', () => this.restoreAutosaveDraft());
    document.getElementById('btn-dismiss-autosave-draft')?.addEventListener('click', () => this.dismissAutosaveDraft());

    // Sidebar Togglers (Top, Icon, Bottom, Topbar)
    document.getElementById('sidebar-toggle-btn')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebar-toggle-top-btn')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebar-expand-btn-icon')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('topbar-sidebar-toggle-btn')?.addEventListener('click', () => this.toggleSidebar());

    // Company Edit Modal
    document.getElementById('btn-save-company-modal')?.addEventListener('click', () => {
      this.saveCompanyFromModal();
    });
    document.getElementById('modal-comp-logo-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.modalCompanyLogoDataUrl = evt.target.result;
          const preview = document.getElementById('modal-comp-logo-preview');
          if (preview) preview.src = this.modalCompanyLogoDataUrl;
        };
        reader.readAsDataURL(file);
      }
    });

    // Global Company Selector in Topbar
    document.getElementById('company-selector')?.addEventListener('change', (e) => {
      this.changeActiveCompany(e.target.value);
    });

    // Editor Company Selector
    document.getElementById('form-company-select')?.addEventListener('change', (e) => {
      this.changeActiveCompany(e.target.value);
    });

    // Custom Logo File Uploader
    document.getElementById('form-logo-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.customLogoDataUrl = evt.target.result;
          document.getElementById('form-logo-preview').src = this.customLogoDataUrl;
          this.updateLivePreview();
          this.showToast('เปลี่ยนโลโก้เอกสารเรียบร้อยแล้ว', 'success');
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset Custom Logo Button
    document.getElementById('btn-reset-company-logo')?.addEventListener('click', () => {
      this.customLogoDataUrl = '';
      const compId = document.getElementById('form-company-select').value;
      const comp = window.storage.getCompany(compId);
      document.getElementById('form-logo-preview').src = comp.logo;
      this.updateLivePreview();
      this.showToast('คืนค่าโลโก้เริ่มต้นเรียบร้อยแล้ว', 'info');
    });

    // Watch Company Name, Tax ID, Tel, Address changes
    ['form-company-name-input', 'form-company-taxid-input', 'form-company-tel-input', 'form-company-address-input'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.updateLivePreview());
    });

    // Editor Document Type Change
    document.getElementById('form-doc-type')?.addEventListener('change', (e) => {
      this.toggleDocTypeFields(e.target.value);
      this.updateNextNumberDisplay();
      this.updateLivePreview();
    });

    // Dynamic Live Preview inputs
    const formInputsToWatch = [
      'form-doc-date', 'form-subject-input', 'form-department-input',
      'form-signer-name-input', 'form-emp-name', 'form-emp-idcard',
      'form-emp-position', 'form-emp-start-date', 'form-emp-purpose'
    ];
    formInputsToWatch.forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.updateLivePreview());
    });

    // Salary Input with Auto Thai Baht Text Conversion
    document.getElementById('form-emp-salary')?.addEventListener('input', (e) => {
      const num = e.target.value;
      const thaiText = window.Utils.thaiBahtText(num);
      document.getElementById('form-emp-salary-text').value = thaiText;
      this.updateLivePreview();
    });

    // Dropdowns with Custom Toggle
    document.getElementById('form-recipient-select')?.addEventListener('change', (e) => {
      const isCustom = e.target.value === '__custom__';
      document.getElementById('form-recipient-custom-group').classList.toggle('hidden', !isCustom);
      this.updateLivePreview();
    });
    document.getElementById('form-recipient-custom')?.addEventListener('input', () => this.updateLivePreview());

    document.getElementById('form-signer-position-select')?.addEventListener('change', (e) => {
      const isCustom = e.target.value === '__custom__';
      document.getElementById('form-signer-position-custom-group').classList.toggle('hidden', !isCustom);
      this.updateLivePreview();
    });
    document.getElementById('form-signer-position-custom')?.addEventListener('input', () => this.updateLivePreview());

    document.getElementById('form-closing-select')?.addEventListener('change', (e) => {
      const isCustom = e.target.value === '__custom__';
      document.getElementById('form-closing-custom-group').classList.toggle('hidden', !isCustom);
      this.updateLivePreview();
    });
    document.getElementById('form-closing-custom')?.addEventListener('input', () => this.updateLivePreview());

    // Document Header Title Controls
    document.getElementById('form-header-title-select')?.addEventListener('change', (e) => {
      const isCustom = e.target.value === '__custom__';
      const customInput = document.getElementById('form-header-title-custom');
      if (isCustom && customInput) {
        customInput.focus();
      }
      this.updateLivePreview();
    });
    document.getElementById('form-header-title-custom')?.addEventListener('input', () => this.updateLivePreview());

    // Form Panel Collapse & Preview Fullscreen Toggles
    document.getElementById('btn-collapse-form-panel')?.addEventListener('click', () => {
      this.toggleFormPanel();
    });
    document.getElementById('btn-expand-form-panel')?.addEventListener('click', () => {
      this.toggleFormPanel(false);
    });
    document.getElementById('btn-toggle-fullscreen-preview')?.addEventListener('click', () => {
      this.toggleFormPanel();
    });

    // Action Buttons
    document.getElementById('btn-save-company-defaults')?.addEventListener('click', () => this.saveCompanyDefaults());
    document.getElementById('btn-save-draft')?.addEventListener('click', () => this.saveDraft());
    document.getElementById('btn-issue-publish')?.addEventListener('click', () => this.confirmAndPublishDoc());
    document.getElementById('btn-issue-number-first')?.addEventListener('click', () => this.issueNumberFirst());
    document.getElementById('btn-custom-doc-number')?.addEventListener('click', () => this.openCustomNumberModal());
    document.getElementById('btn-set-custom-001')?.addEventListener('click', () => this.setCustomNumber001());
    document.getElementById('btn-set-custom-autogap')?.addEventListener('click', () => this.setCustomNumberAutoGap());
    document.getElementById('btn-check-custom-num')?.addEventListener('click', () => this.validateCustomNumberInput());
    document.getElementById('custom-num-input')?.addEventListener('input', () => this.validateCustomNumberInput());
    document.getElementById('btn-apply-custom-number')?.addEventListener('click', () => this.applyCustomDocNumber());
    document.getElementById('btn-sync-heal-sequences')?.addEventListener('click', () => this.autoHealAllSequences());
    document.getElementById('btn-confirm-save-doc')?.addEventListener('click', () => this.confirmAndPublishDoc());
    document.getElementById('btn-delete-doc')?.addEventListener('click', () => this.deleteCurrentDocument());

    // File Attachments Input
    document.getElementById('form-file-attachments')?.addEventListener('change', (e) => {
      this.handleAttachmentUpload(e.target.files);
      e.target.value = ''; // Reset input so same file can be re-uploaded if desired
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
      this.updateLivePreview();
      this.openPdfPreviewModal();
    });
    document.getElementById('btn-export-word')?.addEventListener('click', () => {
      this.updateLivePreview();
      const doc = this.gatherFormData(false);
      if (this.currentEditingDocId) {
        const existing = window.storage.getDocument(this.currentEditingDocId);
        if (existing && existing.docNumber) doc.docNumber = existing.docNumber;
      }
      const comp = window.storage.getCompany(doc.companyId);
      const filename = window.Utils.generateDocFileName(doc, comp, 'doc');
      window.Utils.exportToWord(doc, filename, comp);
    });
    document.getElementById('btn-sync-drive')?.addEventListener('click', () => this.triggerGoogleDriveSync());
    document.getElementById('btn-send-email')?.addEventListener('click', () => this.openEmailModal());
    document.getElementById('btn-signature-pad')?.addEventListener('click', () => this.openSignatureModal());
    document.getElementById('btn-clear-sig')?.addEventListener('click', () => this.clearSignatureFromDoc());
    document.getElementById('btn-test-apps-script')?.addEventListener('click', () => this.testGoogleAppsScriptConnection());

    // Google Sheets Memo List Central Viewers & Shortcuts
    document.getElementById('btn-open-sheet-sidebar')?.addEventListener('click', () => this.openGoogleSheetModal());
    document.getElementById('btn-open-sheet-topbar')?.addEventListener('click', () => this.openGoogleSheetModal());
    document.getElementById('btn-open-sheet-archive')?.addEventListener('click', () => this.openGoogleSheetModal());
    document.getElementById('btn-open-sheet-logs')?.addEventListener('click', () => this.openGoogleSheetModal());
    document.getElementById('btn-open-sheet-settings')?.addEventListener('click', () => this.openGoogleSheetDirect());
    document.getElementById('btn-refresh-sheet-frame')?.addEventListener('click', () => this.refreshGoogleSheetFrame());

    // Topbar Quick Actions
    document.getElementById('btn-quick-new-doc')?.addEventListener('click', () => {
      if (this.hasUserEditedForm()) {
        const ok = confirm('คุณมีเนื้อหาที่กำลังพิมพ์อยู่ ต้องการล้างเพื่อเริ่มเอกสารใหม่หรือไม่?');
        if (!ok) {
          this.navigateTo('editor');
          return;
        }
      }
      this.resetEditorForm();
      this.navigateTo('editor');
    });
    document.getElementById('btn-open-drive-topbar')?.addEventListener('click', () => {
      this.openGoogleDriveFolder();
    });

    // Archive Search & Filter
    document.getElementById('archive-search-input')?.addEventListener('input', () => this.renderArchiveList());
    document.getElementById('archive-filter-company')?.addEventListener('change', (e) => {
      this.setArchiveCompanyFilter(e.target.value);
    });
    document.getElementById('archive-filter-type')?.addEventListener('change', () => this.renderArchiveList());
    document.getElementById('archive-filter-status')?.addEventListener('change', () => this.renderArchiveList());

    // Settings
    document.getElementById('nav-settings-btn')?.addEventListener('click', () => this.openSettingsModal());
    document.getElementById('btn-verify-pin')?.addEventListener('click', () => this.verifyAdminPin());
    document.getElementById('settings-pin-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.verifyAdminPin();
    });
    document.getElementById('btn-save-settings')?.addEventListener('click', () => this.saveGlobalSettings());

    // Email Send
    document.getElementById('btn-confirm-send-email')?.addEventListener('click', () => this.sendEmailAction());

    // Zoom & Fit Controls
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => this.autoFitPreview());
    document.getElementById('btn-zoom-100')?.addEventListener('click', () => this.setPreviewScale(1, false));

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      if (this.currentZoom < 1.4) {
        this.setPreviewScale(Math.min(this.currentZoom + 0.1, 1.4), false);
      }
    });

    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      if (this.currentZoom > 0.32) {
        this.setPreviewScale(Math.max(this.currentZoom - 0.08, 0.32), false);
      }
    });

    // Lamp Login Gate Events
    document.getElementById('lamp-pull-cord')?.addEventListener('click', () => this.toggleLampLight());
    document.getElementById('lamp-bulb')?.addEventListener('click', () => this.toggleLampLight());
    document.getElementById('lamp-role-admin')?.addEventListener('click', () => this.selectLoginRole('admin'));
    document.getElementById('lamp-role-staff')?.addEventListener('click', () => this.selectLoginRole('staff'));
    document.getElementById('lamp-btn-autofill-pin')?.addEventListener('click', () => {
      const pinInput = document.getElementById('lamp-login-pin-input');
      if (pinInput) pinInput.value = 'memoadmin';
    });
    document.getElementById('lamp-btn-enter-app')?.addEventListener('click', () => this.submitLampLogin());
    document.getElementById('lamp-login-pin-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitLampLogin();
    });

    // Lock Screen / Logout buttons
    document.getElementById('btn-lock-screen')?.addEventListener('click', () => this.lockScreen());
    document.getElementById('topbar-btn-lock')?.addEventListener('click', () => this.lockScreen());
  }
}

// Initialize on DOM Ready or immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new MemoApp();
  });
} else {
  window.app = new MemoApp();
}
