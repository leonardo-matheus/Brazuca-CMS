import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock user data
const MOCK_USER = {
  id: '1',
  email: 'leo@mail.com',
  name: 'Leonardo Silva',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_PASSWORD = 'admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate credentials
    if (email !== 'leo@mail.com' || password !== MOCK_PASSWORD) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Generate mock token
    const accessToken = `mock-access-token-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${Date.now()}`;

    // Set cookie on server side (this is the key!)
    const cookieStore = await cookies();
    cookieStore.set('brazuca_auth_token', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      user: MOCK_USER,
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 86400000, // 24 hours
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
