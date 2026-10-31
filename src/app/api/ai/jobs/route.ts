// AI creation stays disabled until a bounded provider integration is implemented.
export async function POST() {
  return Response.json(
    {
      error: {
        code: "AI_NOT_CONFIGURED",
        message: "AI integration is not enabled.",
      },
    },
    { status: 503 },
  );
}
