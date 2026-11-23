import { readFile } from 'node:fs/promises';

export interface PasswdUser {
  uid: number;
  name: string;
}

/** Parses `/etc/passwd` (mounted read-only) to name `lastlog`/`faillog` rows. */
export const parsePasswd = (content: string): PasswdUser[] =>
  content
    .split('\n')
    .map((line) => line.split(':'))
    .filter((fields) => fields.length >= 3 && /^\d+$/.test(fields[2]))
    .map((fields) => ({ name: fields[0], uid: Number(fields[2]) }));

export const readPasswd = async (path: string): Promise<PasswdUser[]> => {
  try {
    const content = await readFile(path, 'utf8');
    return parsePasswd(content.slice(0, 1024 * 1024));
  } catch {
    return [];
  }
};
