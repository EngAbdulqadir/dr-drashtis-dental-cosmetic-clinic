const https = require('https');

const SUPABASE_URL = 'nndyapaaveycsucwipoh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZHlhcGFhdmV5Y3N1Y3dpcG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTIxOTksImV4cCI6MjA4NDIyODE5OX0.FbfLDY46GzTApTqlD1JUnmB2-zxywIAvH2PtT7r5N9k';

const options = {
    hostname: SUPABASE_URL,
    path: '/rest/v1/appointments?select=appointment_date,appointment_time,status&limit=5&order=created_at.desc',
    method: 'GET',
    headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(data));
});

req.on('error', (error) => console.error('Error:', error));
req.end();
