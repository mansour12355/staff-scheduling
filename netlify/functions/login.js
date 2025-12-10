const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.handler = async (event) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password required' }),
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user from database
        const { data: users, error } = await supabase
            .from('staff')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !users) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid credentials' }),
            };
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, users.password_hash);
        if (!validPassword) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid credentials' }),
            };
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: users.id, email: users.email, role: users.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                token,
                user: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    role: users.role,
                },
            }),
        };
    } catch (err) {
        console.error('Login error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database error' }),
        };
    }
};
