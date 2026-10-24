import express, { Request, Response } from 'express'

const webhookApp = express()

webhookApp.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ received: true, message: 'Webhook endpoint active' })
  },
)

export default webhookApp
