import { shellSchema, type Shell } from '#shared/shell'
import shellData from '../../data/shell.json'

// Port for the shell's labels and links. Slice 1b replaces the file source
// with Configuration and Publisher; callers do not change.
export interface ShellSource {
  load(): Promise<unknown>
}

export const fileShellSource: ShellSource = {
  load: async () => shellData,
}

export async function readShell(source: ShellSource = fileShellSource): Promise<Shell> {
  return shellSchema.parse(await source.load())
}
