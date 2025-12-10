const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const user = verifyToken(event.headers.authorization);
        if (!user || user.role !== 'admin') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Admin access required' }),
            };
        }

        const { name, email, password, role } = JSON.parse(event.body);

        if (!name || !email || !password || !role) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        if (!['admin', 'staff'].includes(role)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid role' }),
            };
        }

        const password_hash = await bcrypt.hash(password, 10);
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('staff')
            .insert([{
                name,
                email,
                password_hash,
                role,
            }])
            .select()
            .single();

        if (error) {
            if (error.message.includes('duplicate') || error.code === '23505') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email already exists' }),
                };
            }
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: data.id, message: 'Staff member added successfully' }),
        };
    } catch (err) {
        console.error('Create staff error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database error' }),
        };
    }
};
