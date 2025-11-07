'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { Geolocation, type PermissionStatus, type Position as CapacitorPosition } from '@capacitor/geolocation';
import { Loader2, Radar, MapPin, RefreshCw, Target } from 'lucide-react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useAuthStore } from '@/shared/state/auth-store';
import { apiClient, getErrorMessage } from '@/core/api/client';
import type { UserLocation } from '@/shared/types/database';
import type { DisplayLocation } from '@/features/tracking/components/live-location-map';
import { getLocalizedUserName, getUserInitials } from '@/core/utils';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { PermissionLevel } from '@/core/auth/permission-levels';

const LiveLocationMap = dynamic(
  () =>
    import('@/features/tracking/components/live-location-map').then((mod) => ({
      default: mod.LiveLocationMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface LocationUserMeta {
  id: string;
  fullNameEn?: string;
  fullNameAr?: string;
  email: string;
  avatarUrl?: string;
}

interface ApiLocation extends UserLocation {
  user: LocationUserMeta | null;
}

const SYNC_INTERVAL_MS = 7000;
const SERVER_SYNC_COOLDOWN_MS = 4000;

export default function LiveTrackingPage() {
  const { t, locale } = useI18n();
  const { user } = useAuthStore();
  const { level, canView, isLoading: permissionsLoading } = usePermissionLevel('tracking');
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [teamLocations, setTeamLocations] = useState<ApiLocation[]>([]);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus['location']>('prompt');
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  const watchIdRef = useRef<string | null>(null);
  const fallbackWatchIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);

  const syncLocationWithServer = useCallback(
    async (payload: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      altitude?: number | null;
      speed?: number | null;
      heading?: number | null;
      timestamp?: number;
    }) => {
      if (!user) return;

      try {
        await apiClient.post('/api/locations', {
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracy: payload.accuracy ?? undefined,
          altitude: payload.altitude ?? undefined,
          speed: payload.speed ?? undefined,
          heading: payload.heading ?? undefined,
          timestamp: payload.timestamp,
          platform: Capacitor.getPlatform(),
          isBackground: false,
        });
      } catch (error) {
        console.error('Failed to sync location with server:', error);
        setTrackingError((prev) =>
          prev || getErrorMessage(error, t('tracking.syncError'))
        );
      }
    },
    [t, user]
  );

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition | CapacitorPosition) => {
      if (!user) return;
      const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
      const timestampIso = new Date(position.timestamp ?? Date.now()).toISOString();
      const updatedAt = new Date().toISOString();

      setCurrentLocation((previous) => ({
        id: user.id,
        userId: user.id,
        latitude,
        longitude,
        accuracy: accuracy ?? previous?.accuracy,
        altitude: altitude ?? previous?.altitude,
        speed: speed ?? previous?.speed,
        heading: heading ?? previous?.heading,
        timestamp: timestampIso,
        platform: Capacitor.getPlatform(),
        isBackground: false,
        createdAt: previous?.createdAt ?? timestampIso,
        updatedAt,
      }));

      const now = Date.now();
      if (now - lastSyncRef.current >= SERVER_SYNC_COOLDOWN_MS) {
        lastSyncRef.current = now;
        void syncLocationWithServer({
          latitude,
          longitude,
          accuracy,
          altitude,
          speed,
          heading,
          timestamp: position.timestamp,
        });
      }
    },
    [syncLocationWithServer, user]
  );

  const startTracking = useCallback(async () => {
    if (!user) return;

    try {
      setTrackingError(null);
      
      // Check if we're on mobile with Capacitor
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor for mobile
        const permission = await Geolocation.requestPermissions();
        const status = permission.location;
        setPermissionStatus(status);

        const granted = status === 'granted';
        if (!granted) {
          setTrackingError(t('tracking.permissionDenied'));
          return;
        }

        setIsTracking(true);

        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
          },
          (position, err) => {
            if (err) {
              console.error('Geolocation watch error:', err);
              setTrackingError(t('tracking.genericError'));
              return;
            }
            if (position) {
              handlePositionUpdate(position);
            }
          }
        );
        watchIdRef.current = watchId;
      } else {
        // Use browser geolocation for web
        if (!navigator.geolocation) {
          setTrackingError(t('tracking.notSupported'));
          return;
        }

        // Check permission first
        if ('permissions' in navigator) {
          const permission = await (navigator as any).permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state === 'granted' ? 'granted' : 'prompt');
        }

        setIsTracking(true);

        fallbackWatchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            // Convert browser position to Capacitor format
            const capacitorPosition: CapacitorPosition = {
              timestamp: position.timestamp,
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
            };
            handlePositionUpdate(capacitorPosition);
          },
          (error) => {
            console.error('Browser geolocation error:', error);
            let errorMessage = t('tracking.genericError');
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = t('tracking.permissionDenied');
                setPermissionStatus('denied');
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = t('tracking.positionUnavailable');
                break;
              case error.TIMEOUT:
                errorMessage = t('tracking.timeout');
                break;
            }
            
            setTrackingError(errorMessage);
            setIsTracking(false);
          },
          { 
            enableHighAccuracy: true, 
            maximumAge: 5000, 
            timeout: 10000 
          }
        );
      }
    } catch (error) {
      console.error('Failed to start geolocation tracking:', error);
      setTrackingError(getErrorMessage(error, t('tracking.genericError')));
      setIsTracking(false);
    }
  }, [handlePositionUpdate, t, user]);

  const stopTracking = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative && watchIdRef.current) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } catch (error) {
        console.error('Failed to clear geolocation watch:', error);
      }
      watchIdRef.current = null;
    }

    if (!isNative && fallbackWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(fallbackWatchIdRef.current);
      fallbackWatchIdRef.current = null;
    }

    setIsTracking(false);
  }, []);

  const fetchLocations = useCallback(async () => {
    if (!user || !canView) {
      setIsFetchingLocations(false);
      return;
    }

    try {
      setIsFetchingLocations(true);
      const response = await apiClient.get<ApiLocation[]>('/api/locations', {
        params: { maxAgeMinutes: 60 },
      });

      if (response.success && response.data) {
        setTrackingError(null);
        setTeamLocations(response.data);

        const selfLocation = response.data.find((loc) => loc.userId === user.id);
        if (selfLocation) {
          setCurrentLocation((existing) =>
            existing ? existing : selfLocation
          );
        }
      } else if (!response.success) {
        setTrackingError(response.error || t('tracking.fetchError'));
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setTrackingError(getErrorMessage(error, t('tracking.fetchError')));
    } finally {
      setIsFetchingLocations(false);
    }
  }, [canView, t, user]);

  useEffect(() => {
    if (!user || !canView) {
      setIsTracking(false);
      setTrackingError(null);
      setTeamLocations([]);
      setCurrentLocation(null);
      return;
    }

    void startTracking();
    void fetchLocations();

    pollingIntervalRef.current = setInterval(() => {
      void fetchLocations();
    }, SYNC_INTERVAL_MS);

    return () => {
      void stopTracking();

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchLocations, canView, startTracking, stopTracking, user]);

  const currentDisplayLocation = useMemo<DisplayLocation | null>(() => {
    if (!currentLocation || !user) return null;
    return {
      userId: currentLocation.userId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy ?? undefined,
      updatedAt: currentLocation.updatedAt,
      timestamp: currentLocation.timestamp,
      platform: currentLocation.platform,
      label: getLocalizedUserName(
        {
          fullNameEn: user.fullNameEn,
          fullNameAr: user.fullNameAr,
          email: user.email,
        },
        locale
      ),
      email: user.email,
      isCurrentUser: true,
    };
  }, [currentLocation, locale, user]);

  const otherDisplayLocations = useMemo<DisplayLocation[]>(() => {
    if (!user) return [];

    return teamLocations
      .filter((location) => location.userId !== user.id)
      .map((location) => ({
        userId: location.userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? undefined,
        updatedAt: location.updatedAt,
        timestamp: location.timestamp,
        platform: location.platform,
        label: location.user
          ? getLocalizedUserName(location.user, locale)
          : location.userId,
        email: location.user?.email,
        isCurrentUser: false,
      }));
  }, [locale, teamLocations, user]);

  const sortedVisibleLocations = useMemo(() => {
    const entries = new Map<string, { location: DisplayLocation; avatar?: string }>();

    teamLocations.forEach((loc) => {
      entries.set(loc.userId, {
        location: {
          userId: loc.userId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy ?? undefined,
          updatedAt: loc.updatedAt,
          timestamp: loc.timestamp,
          platform: loc.platform,
          label: loc.user ? getLocalizedUserName(loc.user, locale) : loc.userId,
          email: loc.user?.email,
          isCurrentUser: loc.userId === user?.id,
        },
        avatar: loc.user?.avatarUrl,
      });
    });

    if (currentDisplayLocation) {
      entries.set(currentDisplayLocation.userId, {
        location: currentDisplayLocation,
        avatar: user?.avatarUrl,
      });
    }

    return Array.from(entries.values()).sort((a, b) => {
      const aTime = a.location.updatedAt ? Date.parse(a.location.updatedAt) : 0;
      const bTime = b.location.updatedAt ? Date.parse(b.location.updatedAt) : 0;
      return bTime - aTime;
    });
  }, [currentDisplayLocation, locale, teamLocations, user]);

  if (permissionsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t('accessDenied.title')}</AlertTitle>
          <AlertDescription>{t('messages.noPermission')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{t('tracking.title')}</h1>
          <p className="text-muted-foreground">{t('tracking.description')}</p>
        </div>
        <Badge
          variant={isTracking ? 'default' : 'secondary'}
          className="flex items-center gap-1"
        >
          <Radar className="h-4 w-4" />
          {isTracking ? t('tracking.trackingActive') : t('tracking.trackingInactive')}
        </Badge>
      </div>

      {trackingError ? (
        <Alert variant="destructive">
          <MapPin className="h-4 w-4" />
          <AlertTitle>{t('tracking.errorTitle')}</AlertTitle>
          <AlertDescription>
            <p>{trackingError}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      {permissionStatus !== 'granted' && !currentLocation ? (
        <Alert>
          <Target className="h-4 w-4" />
          <AlertTitle>{t('tracking.awaitingPermission')}</AlertTitle>
          <AlertDescription>
            <p>{t('tracking.permissionPrompt')}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('tracking.mapTitle')}
          </CardTitle>
          <CardDescription>{t('tracking.mapDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LiveLocationMap
            currentLocation={currentDisplayLocation}
            otherLocations={otherDisplayLocations}
            mapHeight={480}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('tracking.activityTitle')}</CardTitle>
            <CardDescription>{t('tracking.activityDescription')}</CardDescription>
          </div>
          <button
            type="button"
            onClick={() => void fetchLocations()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingLocations ? 'animate-spin' : ''}`} />
            {t('tracking.refresh')}
          </button>
        </CardHeader>
        <CardContent>
          {isFetchingLocations && sortedVisibleLocations.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {!isFetchingLocations && sortedVisibleLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tracking.noDevices')}</p>
          ) : null}

          <div className="grid gap-3">
            {sortedVisibleLocations.map(({ location, avatar }) => (
              <div
                key={location.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {avatar ? (
                      <AvatarImage src={avatar} alt={location.label} />
                    ) : (
                      <AvatarFallback>
                        {getUserInitials({
                          fullNameEn: location.label,
                          email: location.email,
                        })}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium leading-tight">
                      {location.label ?? t('tracking.unknownUser')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {location.email ? <span>{location.email}</span> : null}
                      {location.updatedAt ? (
                        <span>
                          {t('tracking.lastUpdated')}: {new Date(location.updatedAt).toLocaleTimeString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span>
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                  {location.platform ? (
                    <span>{t('tracking.platform')}: {location.platform}</span>
                  ) : null}
                  {location.accuracy ? (
                    <span>{t('tracking.accuracy')}: {Math.round(location.accuracy)}m</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
