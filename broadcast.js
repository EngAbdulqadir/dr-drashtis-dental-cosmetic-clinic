/**
 * Bulk SMS Broadcast System
 * Integrates with Textbee.dev Bulk SMS API
 */
class BroadcastSystem {
    constructor() {
        this.recipients = new Map(); // Unique map by phone number
        this.isSending = false;
        this.broadcastLog = [];
        this.bindEvents();
    }

    bindEvents() {
        // We'll call this once DOM is ready or after adding HTML
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
        const discovered = await window.dbAPI.discoverRecipients();
        
        // Clear all except manual/excel entries? Or just merge?
        // Let's assume Discovery is the BASE list.
        this.recipients.clear();
        discovered.forEach(r => this.recipients.set(r.phone, r));

        this.updateRecipientCountDisplay();
    }

    // Add manual number with +91 fixed
    addManualNumber() {
        const input = document.getElementById('manualPhoneInput');
        const nameInput = document.getElementById('manualNameInput');
        let raw = input.value.trim();
        
        // If it starts with 0 or doesn't have 91 prefix and is 10 digits
        if (/^[6-9]\d{9}$/.test(raw)) {
            raw = '+91' + raw;
        } else if (raw.startsWith('0') && raw.length === 11) {
            raw = '+91' + raw.substring(1);
        }

        const normalized = window.phoneUtils.normalizePhone(raw);
        if (normalized) {
            this.recipients.set(normalized, {
                phone: normalized,
                name: nameInput.value.trim() || 'Guest',
                source: 'Manual'
            });
            input.value = '';
            nameInput.value = '';
            this.updateRecipientCountDisplay();
            alert(`Added: ${normalized}`);
        } else {
            alert('Invalid phone number format.');
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
        
        if (countDisplay) countDisplay.innerText = this.recipients.size;
        
        if (listDisplay) {
            listDisplay.innerHTML = Array.from(this.recipients.values())
                .slice(0, 10)
                .map(r => `<div><strong>${r.name}:</strong> ${r.phone} <small>(${r.source})</small></div>`)
                .join('');
            if (this.recipients.size > 10) {
                listDisplay.innerHTML += `<div>...and ${this.recipients.size - 10} more.</div>`;
            }
        }
    }

    // Send Broadcast with batching
    async sendBroadcast() {
        if (this.isSending) return;
        
        const message = document.getElementById('broadcastMessage').value.trim();
        const apiKey = '0e257007-8820-4131-ab85-06fb76c02450'; // Textbee.dev Public API Key (example) OR ask user
        const deviceId = '67d9346f04746f387db053f2'; // Textbee.dev Device ID (example)
        
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
                    // Textbee Bulk SMS API Call
                    const response = await fetch('https://api.textbee.dev/api/v1/gateway/send-bulk-sms', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiKey
                        },
                        body: JSON.stringify({
                            deviceId: deviceId,
                            to: batch,
                            message: message
                        })
                    });

                    const data = await response.json();
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
            
            alert('Broadcast completed successfully! Check the history for details.');
            document.getElementById('broadcastMessage').value = '';
            this.loadHistory();
        } catch (error) {
            console.error('Core Broadcast Error:', error);
            alert('A critical error occurred while sending the broadcast.');
        } finally {
            this.setSendingState(false);
            progressEl.innerHTML = '';
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

    async loadHistory() {
        const historyList = document.getElementById('broadcastHistoryList');
        if (!historyList) return;

        historyList.innerHTML = 'Loading history...';
        const history = await window.dbAPI.getBroadcastHistory();

        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: #888;">No broadcast history found.</div>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <strong>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}</strong>
                    <span class="badge">${item.recipientsCount} recipients</span>
                </div>
                <div class="history-body">
                    <p>${item.message}</p>
                    <div class="history-status">
                        ${item.status.join(', ')}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Global Instance
window.broadcastSystem = new BroadcastSystem();
