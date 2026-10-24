// Whether this deployment is the pre-launch demonstration, from Configuration's
// locked `demo.*` settings (server/utils/demo.ts). They are locked, so their value is
// always the deployment's own: when Configuration cannot answer, that is read instead,
// and a demonstration still asks not to be indexed.
export async function readDemoMode(): Promise<{ enabled: boolean, launchDate: string | null }> {
  try {
    const values = (await getConfiguration({ keys: ['demo.enabled', 'demo.launch-date'], visibility: 'public' }))?.values ?? {}
    const launchDate = values['demo.launch-date']
    return { enabled: values['demo.enabled'] === true, launchDate: typeof launchDate === 'string' ? launchDate : null }
  }
  catch {
    const deployment = demoDeployment()
    return { enabled: deployment['demo.enabled'], launchDate: deployment['demo.launch-date'] }
  }
}
