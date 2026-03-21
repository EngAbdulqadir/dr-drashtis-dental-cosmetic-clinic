const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'dr-drashtis-dental-clinic',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Handle private key formatted with newlines in Vercel
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { appointmentId, patientName, patientEmail, patientPhone, date, time, status } = req.body;

        // 1. Fetch System Settings (Admin Email & SMS Gateway)
        const [clinicSettings, gatewaySettings] = await Promise.all([
            db.collection('settings').doc('clinic').get(),
            db.collection('settings').doc('gateway').get()
        ]);

        const adminEmail = clinicSettings.exists ? clinicSettings.data().adminEmail : 'aqkai52@gmail.com';
        const smsApiKey = gatewaySettings.exists ? gatewaySettings.data().api_key : '0e257007-8820-4131-ab85-06fb76c02450';
        const smsDeviceId = gatewaySettings.exists ? gatewaySettings.data().device_id : '67d9346f04746f387db053f2';

        const results = { emailToPatient: false, emailToAdmin: false, smsToPatient: false };

        // 2. Setup Transporter for Gmail SMTP
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS // Using App Password
                }
            });

            const emailSubject = `Appointment ${status}: Dr. Drashti's Dental Clinic`;
            const emailBody = `
                Hello ${patientName},
                
                Your appointment at Dr. Drashti's Dental & Cosmetic Clinic has been ${status}.
                
                Date: ${date}
                Time: ${time} (Batch: ${time})
                
                Thank you for choosing us for your dental health!
            `;

            // Send to Patient
            if (patientEmail) {
                try {
                    await transporter.sendMail({
                        from: `"Dr. Drashti's Clinic" <${process.env.GMAIL_USER}>`,
                        to: patientEmail,
                        subject: emailSubject,
                        text: emailBody
                    });
                    results.emailToPatient = true;
                } catch (e) { console.error('Patient Email Failed:', e); }
            }

            // Send to Admin
            if (adminEmail) {
                try {
                    await transporter.sendMail({
                        from: `"System Booking" <${process.env.GMAIL_USER}>`,
                        to: adminEmail,
                        subject: `NEW BOOKING: ${patientName}`,
                        text: `New appointment booked for ${patientName} on ${date} at ${time}. \nPhone: ${patientPhone}`
                    });
                    results.emailToAdmin = true;
                } catch (e) { console.error('Admin Email Failed:', e); }
            }
        } else {
            console.error('SMTP Credentials missing: GMAIL_USER / GMAIL_PASS');
        }

        // 3. Send Automatic SMS via Textbee (if configured)
        if (smsApiKey && smsDeviceId && patientPhone) {
            const smsMessage = `Hello ${patientName}, your appointment at Dr. Drashti's Clinic on ${date} at ${time} is ${status}. Thank you!`;

            try {
                // UPDATED ENDPOINT based on Textbee API Documentation
                const smsRes = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${smsDeviceId}/send-sms`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'x-api-key': smsApiKey 
                    },
                    body: JSON.stringify({
                        recipients: [patientPhone], // Plural 'recipients' array
                        message: smsMessage
                    })
                });
                if (smsRes.ok) results.smsToPatient = true;
            } catch (e) { console.error('SMS Notification Failed:', e); }
        }

        return res.status(200).json({ success: true, results });

    } catch (error) {
        console.error('Server side notification error:', error);
        return res.status(500).json({ error: error.message });
    }
}
