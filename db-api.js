// Firebase Firestore Database Integration
// Fully replaces the PHP and Supabase backends.

class DentalDB {
    constructor() {
        console.log('✅ Connecting to Firebase Firestore...');
        this.db = firebase.firestore();
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
            const snapshot = await this.db.collection('appointments')
                .where('appointmentDate', '==', dateStr)
                .where('status', '!=', 'Cancelled')
                .get();

            const bookedSlots = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.appointmentTime) {
                    bookedSlots.push(data.appointmentTime);
                }
            });
            return bookedSlots;
        } catch (error) {
            console.error('Firestore Error (getBookedTimeSlots):', error);
            // Fallback: get all and filter locally if compound query index is missing
            try {
                const snapshot = await this.db.collection('appointments').get();
                const bookedSlots = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.appointmentDate === dateStr && data.status !== 'Cancelled' && data.appointmentTime) {
                        bookedSlots.push(data.appointmentTime);
                    }
                });
                return bookedSlots;
            } catch (fallbackError) {
                return [];
            }
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
}

// Export singleton instance
window.dbAPI = new DentalDB();
