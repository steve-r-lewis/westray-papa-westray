import { shellSchema, type Shell } from '#shared/shell'
import shellData from '../../data/shell.json'

// Port for the shell's labels, links and sections. The site's facts are
// Configuration's and its content Publisher's; this is how the screens draw them.
export interface ShellSource {
  load(): Promise<unknown>
}

export const fileShellSource: ShellSource = {
  load: async () => shellData,
}

export async function readShell(source: ShellSource = fileShellSource): Promise<Shell> {
  return shellSchema.parse(await source.load())
}
