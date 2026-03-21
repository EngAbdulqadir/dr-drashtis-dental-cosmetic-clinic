// Firebase Firestore Database Integration
// Fully replaces the PHP and Supabase backends.

class DentalDB {
    constructor() {
        console.log('✅ Connecting to Firebase Firestore...');
        this.db = firebase.firestore();
        window.db = this.db; // Expose globally for live listeners
        this.auth = firebase.auth();
    }

    // Get all appointments
    async getAppointments() {
        try {
            // Revert orderBy to avoid silent index failures on brand new databases
            const snapshot = await this.db.collection('appointments').get();
            const appointments = [];
            snapshot.forEach((doc) => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return appointments;
        } catch (error) {
            console.error('Firestore Error (getAppointments):', error);
            return [];
        }
    }

    // Create new appointment
    async createAppointment(appointment) {
        try {
            // Because the frontend HTML passes app.id without quotes in onClick handlers 
            // like onClick="deleteAppointment(${app.id})", we MUST ensure the ID remains numeric.
            const newId = (appointment.id || Date.now()).toString();

            await this.db.collection('appointments').doc(newId).set({
                id: parseInt(newId),
                name: appointment.name,
                place: appointment.place || '',
                mobile: appointment.mobile,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                reason: appointment.reason || '',
                fee: appointment.fee || 0,
                status: appointment.status || 'Pending',
                date: appointment.date || new Date().toLocaleDateString(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                id: newId,
                ...appointment
            };
        } catch (error) {
            console.error('Firestore Error (createAppointment):', error);
            throw error;
        }
    }

    // Update appointment
    async updateAppointment(id, updates) {
        try {
            await this.db.collection('appointments').doc(id.toString()).update(updates);
            return { id, ...updates };
        } catch (error) {
            console.error('Firestore Error (updateAppointment):', error);
            return null;
        }
    }

    // Delete appointment
    async deleteAppointment(id) {
        try {
            await this.db.collection('appointments').doc(id.toString()).delete();
            return true;
        } catch (error) {
            console.error('Firestore Error (deleteAppointment):', error);
            return false;
        }
    }

    // Get Booked Time Slots for a specific date
    async getBookedTimeSlots(dateStr) {
        try {
            // Fetch all appointments for a safe fallback that doesn't need indexes
            const snapshot = await this.db.collection('appointments').get();
                
            const bookedSlots = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Filter manually for date and non-cancelled status
                if (data.appointmentDate === dateStr && data.status !== 'Cancelled' && data.appointmentTime) {
                    bookedSlots.push(data.appointmentTime);
                }
            });
            return bookedSlots;
        } catch (error) {
            console.error('Firestore Error (getBookedTimeSlots):', error);
            return [];
        }
    }

    // Get White Label Settings
    async getSettings() {
        try {
            const doc = await this.db.collection('settings').doc('clinic').get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('Firestore Error (getSettings):', error);
            return null;
        }
    }

    // Save White Label Settings
    async saveSettings(settingsData) {
        try {
            await this.db.collection('settings').doc('clinic').set(settingsData, { merge: true });
            return true;
        } catch (error) {
            console.error('Firestore Error (saveSettings):', error);
            return false;
        }
    }

    // NEW: Get SMS Gateway Secrets
    async getGatewaySettings() {
        try {
            const doc = await this.db.collection('settings').doc('gateway').get();
            return doc.exists ? doc.data() : {};
        } catch (error) {
            console.error('Firestore Error (getGatewaySettings):', error);
            return {};
        }
    }

    // NEW: Save SMS Gateway Secrets
    async saveGatewaySettings(data) {
        try {
            await this.db.collection('settings').doc('gateway').set(data, { merge: true });
            return true;
        } catch (error) {
            console.error('Firestore Error (saveGatewaySettings):', error);
            return false;
        }
    }

    // NEW: Delete individual marketing contact
    async deleteMarketingContact(phone) {
        try {
            // Find document with this phone
            const snap = await this.db.collection('marketing_contacts')
                .where('phone', '==', phone)
                .get();
            
            const promises = [];
            snap.forEach(doc => promises.push(doc.ref.delete()));
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Firestore Error (deleteMarketingContact):', error);
            return false;
        }
    }

    // Save SMS Broadcast Report
    async saveBroadcastReport(report) {
        try {
            const docRef = await this.db.collection('sms_broadcasts').add({
                ...report,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Firestore Error (saveBroadcastReport):', error);
            return null;
        }
    }

    // Get SMS Broadcast History
    async getBroadcastHistory() {
        try {
            // Remove orderBy to avoid silent index failures; sort in memory
            const snapshot = await this.db.collection('sms_broadcasts')
                .limit(20)
                .get();
            const history = [];
            snapshot.forEach(doc => {
                history.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side by createdAt desc
            return history.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Firestore Error (getBroadcastHistory):', error);
            return [];
        }
    }

    // Discover Recipients from Firestore
    async discoverRecipients() {
        try {
            const recipients = new Map(); // Use Map to keep unique by phone

            // 1. Fetch from Appointments
            const appSnapshot = await this.db.collection('appointments').get();
            appSnapshot.forEach(doc => {
                const data = doc.data();
                const phone = window.phoneUtils.normalizePhone(data.mobile);
                if (phone && !recipients.has(phone)) {
                    recipients.set(phone, {
                        phone,
                        name: data.name || 'Patient',
                        source: 'Appointments'
                    });
                }
            });

            // 2. Fetch from Users (if it exists)
            try {
                const userSnapshot = await this.db.collection('users').get();
                userSnapshot.forEach(doc => {
                    const data = doc.data();
                    const rawPhone = data.mobile || data.phoneNumber;
                    const phone = window.phoneUtils.normalizePhone(rawPhone);
                    if (phone && !recipients.has(phone)) {
                        recipients.set(phone, {
                            phone,
                            name: data.name || data.displayName || 'User',
                            source: 'Users'
                        });
                    }
                });
            } catch (e) {}

            // 3. Fetch from Marketing Contacts (Manually added & persisted)
            try {
                const marketingSnap = await this.db.collection('marketing_contacts').get();
                console.log(`Found ${marketingSnap.size} persistent marketing contacts.`);
                marketingSnap.forEach(doc => {
                    const data = doc.data();
                    const phone = window.phoneUtils.normalizePhone(data.phone);
                    if (phone && !recipients.has(phone)) {
                        recipients.set(phone, {
                            phone,
                            name: data.name || 'Contact',
                            source: 'Marketing'
                        });
                    }
                });
            } catch (e) {
                console.error('Marketing contacts collection error. Ensure Firestore rules allow reading "marketing_contacts" collection.', e);
            }

            return Array.from(recipients.values());
        } catch (error) {
            console.error('Firestore Error (discoverRecipients):', error);
            return [];
        }
    }

    // Persist a single manual contact
    async saveMarketingContact(contact) {
        try {
            await this.db.collection('marketing_contacts').doc(contact.phone).set(contact, { merge: true });
            return true;
        } catch (error) {
            console.error('Firestore Error (saveMarketingContact):', error);
            return false;
        }
    }
}

// Export singleton instance
window.dbAPI = new DentalDB();
