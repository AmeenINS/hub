import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JWTService } from '@/core/auth/jwt';
import { UserLocationService } from '@/core/data/location-service';
import { UserService } from '@/core/data/user-service';
import { checkPermission } from '@/core/auth/middleware';

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  platform: z.string().optional(),
  isBackground: z.boolean().optional(),
});

const locationService = new UserLocationService();
const userService = new UserService();

function parseAuthorization(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  return header.replace('Bearer ', '');
}

function toIsoTimestamp(input?: string | number): string | undefined {
  if (input === undefined) return undefined;

  if (typeof input === 'number') {
    return new Date(input).toISOString();
  }

  const parsed = Date.parse(input);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return new Date().toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const token = parseAuthorization(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = locationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid location payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const location = await locationService.upsertUserLocation(payload.userId, {
      ...parsed.data,
      timestamp: toIsoTimestamp(parsed.data.timestamp),
    });

    return NextResponse.json({ success: true, data: location }, { status: 200 });
  } catch (error) {
    console.error('Failed to update user location:', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = parseAuthorization(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const canViewLocations = await checkPermission(payload.userId, 'liveTracking', 'read');
    if (!canViewLocations) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const maxAgeParam = searchParams.get('maxAgeMinutes');
    const maxAgeMinutes = maxAgeParam ? Number(maxAgeParam) : 30;

    if (Number.isNaN(maxAgeMinutes) || maxAgeMinutes <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid maxAgeMinutes parameter' }, { status: 400 });
    }

    const locations = await locationService.getActiveLocations(maxAgeMinutes);

    const enriched = await Promise.all(
      locations.map(async (location) => {
        const user = await userService.getUserById(location.userId);
        return {
          ...location,
          user: user
            ? {
                id: user.id,
                fullNameEn: user.fullNameEn,
                fullNameAr: user.fullNameAr,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: enriched,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch user locations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
  }
}
