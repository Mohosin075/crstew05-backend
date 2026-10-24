import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { ShortlistService } from './shortlist.service'
import { JwtPayload } from 'jsonwebtoken'

const getAllShortlists = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await ShortlistService.getAllShortlists(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shortlists retrieved successfully',
    data: result,
  })
})

const getShortlistById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await ShortlistService.getShortlistById(user.userId, id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shortlist retrieved successfully',
    data: result,
  })
})

const createShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await ShortlistService.createShortlist(user.userId, req.body)
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Shortlist created successfully',
    data: result,
  })
})

const updateShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await ShortlistService.updateShortlist(
    user.userId,
    id,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shortlist updated successfully',
    data: result,
  })
})

const deleteShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await ShortlistService.deleteShortlist(user.userId, id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const addCoachToShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { shortlistId, coachId } = req.params
  const result = await ShortlistService.addCoachToShortlist(
    user.userId,
    shortlistId,
    coachId,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const removeCoachFromShortlist = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const { shortlistId, coachId } = req.params
    const result = await ShortlistService.removeCoachFromShortlist(
      user.userId,
      shortlistId,
      coachId,
    )
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: null,
    })
  },
)

export const ShortlistController = {
  getAllShortlists,
  getShortlistById,
  createShortlist,
  updateShortlist,
  deleteShortlist,
  addCoachToShortlist,
  removeCoachFromShortlist,
}
