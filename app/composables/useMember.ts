// The signed-in member, or null. Authentication and Identity fill this in slice 1c;
// until then nobody can sign in, so it is always null and members-only parts of the
// shell, such as the side menu, stay hidden.
export interface Member {
  id: string
  displayName: string
}

export function useMember() {
  return useState<Member | null>('member', () => null)
}
