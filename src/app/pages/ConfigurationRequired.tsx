export function ConfigurationRequired() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-warning bg-warning-surface p-6">
      <h1 className="text-lg font-semibold text-warning">Authentication is not configured</h1>
      <p className="mt-2 text-sm text-ink">
        This portal needs an OpenID Connect provider. Copy <code>.env.example</code> to{' '}
        <code>.env</code> and set <code>VITE_OIDC_AUTHORITY</code> and{' '}
        <code>VITE_OIDC_CLIENT_ID</code>, then restart the dev server.
      </p>
      <p className="mt-2 text-sm text-ink">
        The repository ships a ready-to-use Keycloak realm under <code>docker/keycloak</code>.
      </p>
    </div>
  )
}
