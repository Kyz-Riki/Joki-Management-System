export const ok = (data: unknown, status = 200) =>
  Response.json({ success: true, data }, { status });

export const err = (code: string, message: string, status: number) =>
  Response.json({ success: false, error: { code, message } }, { status });
