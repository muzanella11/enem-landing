import type {
  AlertEmailStatus,
  AlertSeverity,
} from '@enem-landing/shared-types';

export const EMAIL_STATUS: Record<
  AlertEmailStatus,
  { label: string; color: string }
> = {
  queued: { label: 'antre/retry', color: 'info' },
  sent: { label: 'terkirim', color: 'success' },
  failed: { label: 'gagal', color: 'error' },
  cooldown: { label: 'cooldown', color: 'grey' },
  'dev-disabled': { label: 'tidak dikirim (bukan prod)', color: 'grey' },
  'cms-disabled': { label: 'email dimatikan di CMS', color: 'warning' },
  dropped: { label: 'dibuang, outbox penuh', color: 'error' },
};

export const SEVERITY: Record<AlertSeverity, { label: string; color: string }> =
  {
    critical: { label: 'kritis', color: 'error' },
    warning: { label: 'peringatan', color: 'warning' },
    info: { label: 'info', color: 'info' },
  };
