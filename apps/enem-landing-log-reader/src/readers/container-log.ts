import type {
  ContainerLogLine,
  ContainerStream,
} from '@enem-landing/shared-types';
import type { LineTransform } from './tail-reader.js';

/** One line of Docker's json-file driver: `{"log":"...\n","stream":"stdout","time":"..."}`. */
export const parseContainerLine = (line: string): ContainerLogLine => {
  try {
    const parsed = JSON.parse(line) as {
      log?: unknown;
      stream?: unknown;
      time?: unknown;
    };
    return {
      time: typeof parsed.time === 'string' ? parsed.time : '',
      stream: parsed.stream === 'stderr' ? 'stderr' : 'stdout',
      message:
        typeof parsed.log === 'string' ? parsed.log.replace(/\r?\n$/, '') : '',
    };
  } catch {
    return { time: '', stream: 'stdout', message: line };
  }
};

export const createContainerLineTransform = (
  match: (text: string) => boolean,
  stream: ContainerStream | undefined,
): LineTransform<ContainerLogLine> => {
  return (line) => {
    const parsed = parseContainerLine(line);
    if (stream && parsed.stream !== stream) return null;
    return match(parsed.message) ? parsed : null;
  };
};
