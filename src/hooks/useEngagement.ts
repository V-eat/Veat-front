import { useQuery } from '@tanstack/react-query';
import * as engagementService from '@/api/services/engagement.service';

export function useLoyaltySummary(userId: string | undefined) {
  return useQuery({
    queryKey: ['loyalty-summary', userId],
    queryFn: () => engagementService.getLoyaltySummary(),
    enabled: !!userId,
  });
}

export function useRecommendations(userId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => engagementService.getRecommendations(),
    enabled: !!userId,
  });
}

export function useDynamicPromotions(userId: string | undefined) {
  return useQuery({
    queryKey: ['dynamic-promotions', userId],
    queryFn: () => engagementService.getDynamicPromotions(),
    enabled: !!userId,
  });
}
