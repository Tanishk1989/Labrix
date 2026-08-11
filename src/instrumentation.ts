export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production"
  ) {
    return;
  }

  const { validateDeploymentEnvironment } = await import(
    "@/server/config/deployment"
  );
  validateDeploymentEnvironment(process.env);
}
