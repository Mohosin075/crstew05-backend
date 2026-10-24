import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AnalyticsService } from './analytics.service'
import { JwtPayload } from 'jsonwebtoken'

const getOrgSummary = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await AnalyticsService.getOrgSummary(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organization analytics summary retrieved successfully',
    data: result,
  })
})

const getPlatformOverview = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AnalyticsService.getPlatformOverview()
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Platform overview metrics retrieved successfully',
      data: result,
    })
  },
)

const trackEvent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { eventType, metadata } = req.body
  const result = await AnalyticsService.trackEvent(
    user.userId,
    eventType,
    metadata,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Event tracked successfully',
    data: result,
  })
})

export const AnalyticsController = {
  getOrgSummary,
  getPlatformOverview,
  trackEvent,
}
