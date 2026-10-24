import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'

const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      })

      // Only write back body (Zod defaults/transforms). Avoid overwriting
      // Express query/params types which cause request typing mismatches.
      if (parsed && typeof parsed === 'object' && 'body' in parsed) {
        req.body = (parsed as { body?: unknown }).body ?? req.body
      }

      return next()
    } catch (error) {
      next(error)
    }
  }

export default validateRequest
