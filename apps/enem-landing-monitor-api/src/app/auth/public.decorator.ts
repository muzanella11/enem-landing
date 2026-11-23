import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_METADATA = 'enem-landing-monitor:public';

/**
 * Opts a route out of the global SuperAdmin guard. Only the container
 * healthcheck uses it; a test makes sure nothing else does by accident.
 */
export const Public = () => SetMetadata(IS_PUBLIC_METADATA, true);
