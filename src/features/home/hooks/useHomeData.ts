import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '@shared/constants/endpoints';


interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
}

interface ParkingActivity {
  id: string;
  slotCode: string;
  floor: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  duration?: number;
}

export const useHomeData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSlots: 120,
    availableSlots: 45,
    occupiedSlots: 65,
    reservedSlots: 10,
  });
  const [activities, setActivities] = useState<ParkingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await apiClient.get<DashboardStats>(ENDPOINTS.GET_STATS);
      setStats(statsResponse.data);

      // Fetch recent activities
      const activitiesResponse = await apiClient.get<{ items: ParkingActivity[] }>(ENDPOINTS.GET_PARKING_HISTORY);
      setActivities(activitiesResponse.data.items || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err as Error);
      
      // Mock data for development
      setActivities([
        {
          id: '1',
          slotCode: 'A1-05',
          floor: 1,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        },
        {
          id: '2',
          slotCode: 'B2-12',
          floor: 2,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          duration: 120,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    activities,
    isLoading,
    error,
    refreshData,
  };
};