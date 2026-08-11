import {
  validateDeploymentEnvironment,
  type DeploymentEnvironment,
} from "@/server/config/deployment";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export function createHealthResponse(environment: DeploymentEnvironment) {
  try {
    validateDeploymentEnvironment(environment);
    return Response.json(
      { status: "ok" },
      { status: 200, headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: responseHeaders },
    );
  }
}

export function GET() {
  return createHealthResponse(process.env);
}
