import type { ContainerMetricsList } from '@enem-landing/shared-types';
import { monitorFetch } from './use-monitor-api';
import { usePoll } from './use-poll';

/** cgroup memory/CPU per running container, every 15 s. */
export const useContainerMetrics = () =>
  usePoll(
    () => monitorFetch<ContainerMetricsList>('metrics/containers'),
    15_000,
  );
