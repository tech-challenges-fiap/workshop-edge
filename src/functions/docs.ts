import openapiYaml from "../../docs/openapi.yaml" with { type: "text" };

type ApiGatewayHttpEvent = {
  rawPath?: string;
  requestContext?: {
    stage?: string;
    http?: { method?: string };
  };
  httpMethod?: string;
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export async function handler(event: ApiGatewayHttpEvent): Promise<LambdaResponse> {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "GET";

  if (method.toUpperCase() !== "GET") {
    return jsonResponse(405, { error: "MethodNotAllowed", message: "only GET is supported" });
  }

  const rawPath = event.rawPath ?? "";
  const stage = event.requestContext?.stage;
  const path =
    stage && rawPath.startsWith(`/${stage}/`) ? rawPath.slice(stage.length + 1) : rawPath;

  if (path === "/openapi.yaml") {
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/yaml",
        "cache-control": "public, max-age=300",
      },
      body: openapiYaml,
    };
  }

  if (path === "/docs") {
    return {
      statusCode: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
      body: swaggerUiHtml(),
    };
  }

  return jsonResponse(404, { error: "NotFound", message: "route not found" });
}

function swaggerUiHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Workshop Edge — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: './openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;
}

function jsonResponse(statusCode: number, body: Record<string, unknown>): LambdaResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
