import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { SubscriptionService } from './subscription.service'
import { JwtPayload } from 'jsonwebtoken'

const getCurrentSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const result = await SubscriptionService.getCurrentSubscription(user.userId)
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Current subscription retrieved successfully',
      data: result,
    })
  },
)

const changePlan = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { plan } = req.body
  const result = await SubscriptionService.changePlan(user.userId, plan)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  })
})

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await SubscriptionService.cancelSubscription(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const getBillingPortalUrl = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await SubscriptionService.getBillingPortalUrl(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Billing portal URL retrieved successfully',
    data: { url: result },
  })
})

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { plan, billingCycle } = req.body
  const result = await SubscriptionService.createCheckoutSession(
    user.userId,
    plan,
    billingCycle,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Checkout session created successfully',
    data: result,
  })
})

export const SubscriptionController = {
  getCurrentSubscription,
  changePlan,
  cancelSubscription,
  getBillingPortalUrl,
  createCheckoutSession,
}

