// The signed-in member, or null: someone signed in at the level the site requires,
// with their second step done (Authentication's session). Members-only parts of the
// shell, such as the side menu, are drawn only for them. For the screens only: the
// server decides every request again.
export interface Member {
  id: string
}

export function useMember() {
  const { principal, needsSecondFactor } = useAuthentication()
  return computed<Member | null>(() => (principal.value && !needsSecondFactor.value ? { id: principal.value.principalId } : null))
}
