/**
 * Bulk SMS Broadcast System
 * Integrates with Textbee.dev Bulk SMS API
 */
class BroadcastSystem {
    constructor() {
        this.recipients = new Map(); // Unique map by phone number
        this.isSending = false;
        this.broadcastLog = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.bindEvents();
    }

    bindEvents() {
        // Handle file name display for excel
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'excelUpload') {
                const fileName = e.target.files[0]?.name || '';
                const display = document.getElementById('excelFileName');
                if (display) display.innerText = fileName ? `Selected: ${fileName}` : '';
            }
        });
    }

    // Toggle between tabs (Patient Records vs Broadcast)
    showTab(tabId) {
        document.querySelectorAll('.dashboard-tab').forEach(t => t.style.display = 'none');
        document.getElementById(tabId).style.display = 'block';
        
        // Update nav buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

        if (tabId === 'broadcastSection') {
            this.refreshDiscovery();
            this.loadHistory();
        }
    }

    // Combine all discovery into one unique list
    async refreshDiscovery() {
        const statsEl = document.getElementById('discoveryStats');
        if (statsEl) statsEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing contacts...';

        // 1. Fetch from Firestore (via dbAPI)
        try {
            const discovered = await window.dbAPI.discoverRecipients();
            
            // Clear all except manual/excel entries? Or just merge?
            // Let's assume Discovery is the BASE list.
            this.recipients.clear();
            discovered.forEach(r => this.recipients.set(r.phone, r));
        } catch (e) {
            console.error('Discovery Error:', e);
        }

        if (statsEl) statsEl.innerHTML = '<i class="fas fa-users-cog"></i> Discovery: ';
        this.updateRecipientCountDisplay();
    }

    // Add manual number with +91 fixed
    addManualNumber() {
        const input = document.getElementById('manualPhoneInput');
        const nameInput = document.getElementById('manualNameInput');
        const phoneError = document.getElementById('manualPhoneError');
        const nameError = document.getElementById('manualNameError');
        const successMsg = document.getElementById('manualSuccessMsg');
        
        let raw = input.value.trim();
        let name = nameInput.value.trim();
        let hasError = false;

        // Reset errors
        phoneError.style.display = 'none';
        nameError.style.display = 'none';
        successMsg.style.display = 'none';

        if (!name) {
            nameError.style.display = 'block';
            hasError = true;
        }

        // Must be exactly 10 digits for India
        if (!/^\d{10}$/.test(raw)) {
            phoneError.style.display = 'block';
            hasError = true;
        }

        if (hasError) return;

        // Normalize
        const normalized = window.phoneUtils.normalizePhone('+91' + raw);
        if (normalized) {
            const contactData = {
                phone: normalized,
                name: name,
                source: 'Manual',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // 1. ADD LOCALLY for zero-latency UI update
            this.recipients.set(normalized, contactData);
            this.updateRecipientCountDisplay();

            // 2. PERSIST to Firestore for long-term storage
            window.dbAPI.saveMarketingContact(contactData).then((success) => {
                if (!success) {
                    alert('Warning: Could not save to cloud. Please check your Firestore rules/connection.');
                }
                this.refreshDiscovery(); // Sync with cloud state
                input.value = '';
                nameInput.value = '';
                
                // Show inline success
                successMsg.style.display = 'block';
                setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
            }).catch(e => {
                console.error('Persistence Failure:', e);
            });
        } else {
            phoneError.style.display = 'block';
        }
    }

    // Handle Excel Upload
    handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                let added = 0;
                jsonData.forEach(item => {
                    // Try different column name variants
                    const name = item.Name || item.name || item.Patient || 'Guest';
                    const rawPhone = item.Mobile || item.mobile || item['Mobile Number'] || item.Phone;
                    
                    if (rawPhone) {
                        const normalized = window.phoneUtils.normalizePhone(rawPhone);
                        if (normalized) {
                            this.recipients.set(normalized, {
                                phone: normalized,
                                name: name,
                                source: 'Excel'
                            });
                            added++;
                        }
                    }
                });

                this.updateRecipientCountDisplay();
                alert(`Imported ${added} valid contacts from Excel.`);
            } catch (err) {
                console.error('Excel Parse Error:', err);
                alert('Error parsing Excel file. Ensure it has "Name" and "Mobile" columns.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    updateRecipientCountDisplay() {
        const countDisplay = document.getElementById('totalRecipientCount');
        const listDisplay = document.getElementById('recipientListPreview');
        const pageIndicator = document.getElementById('pageIndicator');
        
        const allRecipients = Array.from(this.recipients.values()).sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '');
        });
        const total = allRecipients.length;
        
        if (countDisplay) countDisplay.innerText = total;
        
        if (listDisplay) {
            if (total === 0) {
                listDisplay.innerHTML = '<div style="padding: 20px; text-align: center; color: #718096;">No recipients discovered yet. Add manually or upload Excel.</div>';
                return;
            }

            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            const paginatedItems = allRecipients.slice(start, end);

            listDisplay.innerHTML = paginatedItems.map((r, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #edf2f7; ${idx % 2 === 0 ? 'background: #fff;' : 'background: #f8fafc;'}">
                    <div>
                        <div style="font-weight: 600; color: #2d3748;">${r.name}</div>
                        <div style="font-size: 0.8rem; color: #4a5568;">${r.phone}</div>
                    </div>
                    <span style="font-size: 0.7rem; background: #e2e8f0; padding: 2px 8px; border-radius: 10px; color: #4a5568;">${r.source}</span>
                </div>
            `).join('');

            if (pageIndicator) {
                const totalPages = Math.ceil(total / this.pageSize) || 1;
                pageIndicator.innerText = `Page ${this.currentPage} of ${totalPages}`;
            }
        }
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.recipients.size / this.pageSize);
        const newPage = this.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.updateRecipientCountDisplay();
        }
    }

    // Send Broadcast with batching
    async sendBroadcast() {
        if (this.isSending) return;
        
        const message = document.getElementById('broadcastMessage').value.trim();
        
        // Fetch centralized credentials from Firestore on every send for security/sync
        const settings = await window.dbAPI.getGatewaySettings();
        const apiKey = settings.api_key || '0e257007-8820-4131-ab85-06fb76c02450';
        const deviceId = settings.device_id || '67d9346f04746f387db053f2';
        
        if (!settings.api_key || !settings.device_id) {
            console.log('Using default gateway credentials...');
            // We'll proceed with defaults if explicitly configured not to be empty, 
            // but for security it's best if they are always in Firestore.
        }
        
        if (!message) {
            alert('Please enter a message.');
            return;
        }

        if (this.recipients.size === 0) {
            alert('No recipients found.');
            return;
        }

        if (!confirm(`Are you sure you want to send this broadcast to ${this.recipients.size} recipients?`)) {
            return;
        }

        this.setSendingState(true);
        const progressEl = document.getElementById('broadcastProgress');
        const recipientList = Array.from(this.recipients.keys());
        const total = recipientList.length;
        const batchSize = 200;
        const results = [];

        try {
            for (let i = 0; i < total; i += batchSize) {
                const batch = recipientList.slice(i, i + batchSize);
                const currentBatchNumber = Math.floor(i / batchSize) + 1;
                
                progressEl.innerHTML = `Sending batch ${currentBatchNumber}... (${i}/${total})`;
                
                try {
                    // UPDATED ENDPOINT based on Textbee API Documentation
                    // Format: https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/send-sms
                    const endpoint = `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`;
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiKey
                        },
                        body: JSON.stringify({
                            recipients: batch, // Textbee uses 'recipients' array
                            message: message
                        })
                    });

                    let data = {};
                    try {
                        data = await response.json();
                    } catch (e) {
                        data = { message: 'Non-JSON response' };
                    }
                    results.push({
                        batch: currentBatchNumber,
                        success: response.ok,
                        count: batch.length,
                        data: data
                    });
                } catch (batchError) {
                    console.error(`Batch ${currentBatchNumber} failed:`, batchError);
                    results.push({
                        batch: currentBatchNumber,
                        success: false,
                        count: batch.length,
                        error: batchError.message
                    });
                }
            }

            // Audit Trail - Save to Firestore
            const auditData = {
                message: message,
                recipientsCount: total,
                status: results.map(r => `Batch ${r.batch}: ${r.success ? 'Success' : 'Failure'}`),
                batchDetails: results,
                batchIds: results.map(r => r.data?.smsId || r.data?.id).filter(id => id)
            };
            
            await window.dbAPI.saveBroadcastReport(auditData);
            
            alert(`Broadcast completed! \nTotal Sent: ${results.filter(r => r.success).length}/${results.length} batches.`);
            document.getElementById('broadcastMessage').value = '';
            this.loadHistory();
        } catch (error) {
            console.error('Core Broadcast Error:', error);
            alert('A critical error occurred while sending the broadcast: ' + error.message);
        } finally {
            this.setSendingState(false);
            if (progressEl) progressEl.innerHTML = '';
        }
    }

    setSendingState(sending) {
        this.isSending = sending;
        const btn = document.getElementById('sendBroadcastBtn');
        if (btn) {
            btn.disabled = sending;
            btn.innerHTML = sending ? '<i class="fas fa-spinner fa-spin"></i> Sending...' : '<i class="fas fa-paper-plane"></i> Send Broadcast';
        }
    }

    // Modified to use real-time listeners for "Live Dashboard" experience
    async loadHistory() {
        const historyList = document.getElementById('broadcastHistoryList');
        if (!historyList) return;

        // Unsubscribe from previous listener if exists
        if (this.historyUnsubscribe) {
            this.historyUnsubscribe();
        }

        historyList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-circle-notch fa-spin"></i> Loading live reports...</div>';
        
        // Use dbAPI to get the collection and listen for changes
        try {
            this.historyUnsubscribe = window.db.collection('sms_broadcasts')
                .limit(20)
                .onSnapshot(snapshot => {
                    const history = [];
                    snapshot.forEach(doc => {
                        history.push({ id: doc.id, ...doc.data() });
                    });
                    
                    // Client-side sort
                    history.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                        return dateB - dateA;
                    });

                    if (history.length === 0) {
                        historyList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No broadcast records found.</div>';
                        return;
                    }

                    historyList.innerHTML = history.map(item => `
                        <div class="history-item">
                            <div class="history-header">
                                <div>
                                    <strong>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}</strong>
                                    <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">"${item.message.substring(0, 60)}${item.message.length > 60 ? '...' : ''}"</div>
                                </div>
                                <span class="badge" style="background: ${this.getStatusColor(item)}">${item.recipientsCount} recipients</span>
                            </div>
                            <div class="history-body">
                                <div class="history-status">
                                    ${Array.isArray(item.status) ? item.status.map(s => `<span>${s}</span>`).join(' | ') : 'Sent'}
                                </div>
                            </div>
                        </div>
                    `).join('');
                });
        } catch (err) {
            console.error('Snapshot Error:', err);
            historyList.innerHTML = '<div style="color: red; text-align: center;">Failed to connect to live stream.</div>';
        }
    }

    getStatusColor(item) {
        if (!item.status) return 'var(--secondary-color)';
        const statusStr = Array.isArray(item.status) ? item.status.join('') : item.status;
        if (statusStr.includes('Failure') || statusStr.includes('Error')) return '#e53e3e';
        if (statusStr.includes('Success')) return '#38a169';
        return 'var(--secondary-color)';
    }

    // SMS Gateway Settings
    async openSmsSettings() {
        const modal = document.getElementById('smsSettingsModal');
        if (modal) {
            const settings = await window.dbAPI.getGatewaySettings();
            // Pre-fill with existing or default values
            document.getElementById('smsApiKey').value = settings.api_key || '0e257007-8820-4131-ab85-06fb76c02450';
            document.getElementById('smsDeviceId').value = settings.device_id || '67d9346f04746f387db053f2';
            modal.style.display = 'flex';
        }
    }

    async saveSmsSettings(e) {
        e.preventDefault();
        const apiKey = document.getElementById('smsApiKey').value.trim();
        const deviceId = document.getElementById('smsDeviceId').value.trim();
        
        const success = await window.dbAPI.saveGatewaySettings({
            api_key: apiKey,
            device_id: deviceId
        });
        
        if (success) {
            document.getElementById('smsSettingsModal').style.display = 'none';
            alert('SMS Gateway Configuration Saved to Firestore!');
        } else {
            alert('Failed to save settings. Check permissions.');
        }
    }
}

// Global Instance
window.broadcastSystem = new BroadcastSystem();
