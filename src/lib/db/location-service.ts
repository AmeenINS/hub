import { lmdb } from './lmdb';
import type { UserLocation } from '@/types/database';

export interface LocationUpdateInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
  platform?: string;
  isBackground?: boolean;
}

/**
 * User Location Service
 * Handles storing and retrieving live user location data.
 */
export class UserLocationService {
  private readonly dbName = 'userLocations';

  /**
   * Create or update a user's location entry.
   */
  async upsertUserLocation(userId: string, input: LocationUpdateInput): Promise<UserLocation> {
    await lmdb.initialize();
    const existing = await lmdb.getById<UserLocation>(this.dbName, userId);
    const nowIso = new Date().toISOString();

    const record: UserLocation = {
      id: existing?.id ?? userId,
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      altitude: input.altitude,
      speed: input.speed,
      heading: input.heading,
      timestamp: input.timestamp ?? existing?.timestamp ?? nowIso,
      platform: input.platform ?? existing?.platform,
      isBackground: input.isBackground ?? existing?.isBackground ?? false,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    const db = lmdb.getDatabase(this.dbName);
    await db.put(userId, record);
    return record;
  }

  /**
   * Retrieve a single user's latest location.
   */
  async getUserLocation(userId: string): Promise<UserLocation | null> {
    return lmdb.getById<UserLocation>(this.dbName, userId);
  }

  /**
   * Get all locations updated within the provided time window.
   */
  async getActiveLocations(maxAgeMinutes = 30): Promise<UserLocation[]> {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
    const all = await lmdb.getAll<UserLocation>(this.dbName);

    return all.filter((location) => {
      const updatedAt = new Date(location.updatedAt ?? location.timestamp).getTime();
      return Number.isFinite(updatedAt) && updatedAt >= cutoff;
    });
  }

  /**
   * Remove a user's location entry completely.
   */
  async deleteUserLocation(userId: string): Promise<boolean> {
    return lmdb.delete(this.dbName, userId);
  }
}
