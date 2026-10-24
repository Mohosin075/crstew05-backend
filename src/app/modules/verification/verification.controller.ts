import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { VerificationService } from './verification.service'
import { JwtPayload } from 'jsonwebtoken'

const submitVerification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await VerificationService.submitVerification(
    user.userId,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Verification request submitted successfully',
    data: result,
  })
})

const getQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.getQueue()
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Verification queue retrieved successfully',
    data: result,
  })
})

const approve = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { note } = req.body
  const result = await VerificationService.approve(id, user.userId, note)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const reject = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { reason } = req.body
  const result = await VerificationService.reject(id, user.userId, reason)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const requestInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { note } = req.body
  const result = await VerificationService.requestInfo(id, user.userId, note)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const { entityId } = req.params
  const result = await VerificationService.getStatus(entityId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Verification status retrieved successfully',
    data: result,
  })
})

export const VerificationController = {
  submitVerification,
  getQueue,
  approve,
  reject,
  requestInfo,
  getStatus,
}
