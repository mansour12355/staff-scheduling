const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Verify authentication
        const user = verifyToken(event.headers.authorization);
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get schedules based on user role
        let query = supabase
            .from('schedules')
            .select(`
                *,
                staff:staff_id (
                    name,
                    email
                )
            `)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        // If not admin, only show user's own schedules
        if (user.role !== 'admin') {
            query = query.eq('staff_id', user.id);
        }

        const { data: schedules, error } = await query;

        if (error) {
            throw error;
        }

        // Format response to match expected structure
        const formattedSchedules = schedules.map(schedule => ({
            ...schedule,
            staff_name: schedule.staff?.name,
            staff_email: schedule.staff?.email,
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(formattedSchedules),
        };
    } catch (err) {
        console.error('Get schedules error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database error' }),
        };
    }
};
