import { toast } from "sonner";

export const notify = {
  ok: (msg, opts) => toast.success(msg, opts),
  info: (msg, opts) => toast.message(msg, opts),
  warn: (msg, opts) => toast.warning(msg, opts),
  err: (msg, opts) => toast.error(msg, opts),
};
