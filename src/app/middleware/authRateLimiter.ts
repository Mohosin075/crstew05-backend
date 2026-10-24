import rateLimit from 'express-rate-limit'

/** Stricter limit for auth/OTP endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many auth attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})
