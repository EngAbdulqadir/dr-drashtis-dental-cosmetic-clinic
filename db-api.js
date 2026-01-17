// Supabase Database Integration - Free & Open Source
// Get your Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api

const SUPABASE_URL = 'https://nndyapaaveycsucwipoh.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZHlhcGFhdmV5Y3N1Y3dpcG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTIxOTksImV4cCI6MjA4NDIyODE5OX0.FbfLDY46GzTApTqlD1JUnmB2-zxywIAvH2PtT7r5N9k'; // Replace with your anon/public key

class SupabaseDB {
    constructor() {
        this.useSupabase = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

        if (this.useSupabase) {
            // Initialize Supabase client
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connected to Supabase database');
        } else {
            console.log('📦 Using localStorage (configure Supabase for cloud database)');
        }
    }

    // Get all appointments
    async getAppointments() {
        if (!this.useSupabase) {
            return JSON.parse(localStorage.getItem('dentalAppointments')) || [];
        }

        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform to match localStorage format
            return data.map(apt => ({
                id: apt.id,
                date: apt.booking_date,
                appointmentDate: apt.appointment_date,
                appointmentTime: apt.appointment_time,
                name: apt.name,
                place: apt.place,
                mobile: apt.mobile,
                reason: apt.reason,
                fee: parseFloat(apt.fee),
                status: apt.status
            }));
        } catch (error) {
            console.error('Supabase error:', error);
            return JSON.parse(localStorage.getItem('dentalAppointments')) || [];
        }
    }

    // Create new appointment
    async createAppointment(appointment) {
        if (!this.useSupabase) {
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            const newAppointment = { ...appointment, id: Date.now() };
            appointments.push(newAppointment);
            localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
            return newAppointment;
        }

        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .insert([{
                    name: appointment.name,
                    place: appointment.place,
                    mobile: appointment.mobile,
                    appointment_date: appointment.appointmentDate,
                    appointment_time: appointment.appointmentTime,
                    reason: appointment.reason,
                    fee: appointment.fee || 0,
                    status: appointment.status || 'Pending',
                    booking_date: appointment.date || new Date().toLocaleDateString()
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                date: data.booking_date,
                appointmentDate: data.appointment_date,
                appointmentTime: data.appointment_time,
                name: data.name,
                place: data.place,
                mobile: data.mobile,
                reason: data.reason,
                fee: parseFloat(data.fee),
                status: data.status
            };
        } catch (error) {
            console.error('Supabase error:', error);
            // Fallback to localStorage
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            const newAppointment = { ...appointment, id: Date.now() };
            appointments.push(newAppointment);
            localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
            return newAppointment;
        }
    }

    // Update appointment
    async updateAppointment(id, updates) {
        if (!this.useSupabase) {
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index] = { ...appointments[index], ...updates };
                localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
                return appointments[index];
            }
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .update({
                    status: updates.status,
                    fee: updates.fee
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                date: data.booking_date,
                appointmentDate: data.appointment_date,
                appointmentTime: data.appointment_time,
                name: data.name,
                place: data.place,
                mobile: data.mobile,
                reason: data.reason,
                fee: parseFloat(data.fee),
                status: data.status
            };
        } catch (error) {
            console.error('Supabase error:', error);
            // Fallback to localStorage
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index] = { ...appointments[index], ...updates };
                localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
                return appointments[index];
            }
            return null;
        }
    }

    // Delete appointment
    async deleteAppointment(id) {
        if (!this.useSupabase) {
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            appointments = appointments.filter(a => a.id !== id);
            localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
            return true;
        }

        try {
            const { error } = await this.supabase
                .from('appointments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Supabase error:', error);
            // Fallback to localStorage
            let appointments = JSON.parse(localStorage.getItem('dentalAppointments')) || [];
            appointments = appointments.filter(a => a.id !== id);
            localStorage.setItem('dentalAppointments', JSON.stringify(appointments));
            return true;
        }
    }
}

// Export singleton instance
window.dbAPI = new SupabaseDB();
