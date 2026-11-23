import { AppError } from '../../common/error/AppError.js';
import * as service from './comment.service.js';
import { listQuerySchema, replySchema } from './comment.schema.js';

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }
  return result.data;
}

const ok = (res, data) => res.json({ data });

export async function list(req, res) {
  ok(res, await service.list(parse(listQuerySchema, req.query)));
}

export async function reply(req, res) {
  const { content } = parse(replySchema, req.body ?? {});
  ok(res, await service.reply(Number(req.params.id), content, req.user.id));
}

export async function removeReply(req, res) {
  ok(res, await service.removeReply(Number(req.params.id)));
}
