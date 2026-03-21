import { getHandlers } from "@/libraries/auth";

export const GET = (
  ...args: Parameters<ReturnType<typeof getHandlers>["GET"]>
) => getHandlers().GET(...args);

export const POST = (
  ...args: Parameters<ReturnType<typeof getHandlers>["POST"]>
) => getHandlers().POST(...args);
