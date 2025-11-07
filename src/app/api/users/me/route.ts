import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { UserService } from '@/core/data/user-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userService = new UserService();
    const user = await userService.getUserById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't send password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { fullNameEn, fullNameAr, phoneNumber } = body;

    const userService = new UserService();
    const user = await userService.updateUser(payload.userId, {
      fullNameEn,
      fullNameAr,
      phoneNumber,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't send password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
