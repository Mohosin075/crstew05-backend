import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { OpportunityService } from './opportunity.service'
import { JwtPayload } from 'jsonwebtoken'

const createOpportunity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await OpportunityService.createOpportunity(
    user.userId,
    user.role,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Opportunity published successfully',
    data: result,
  })
})

const getAllOpportunities = catchAsync(async (req: Request, res: Response) => {
  const result = await OpportunityService.getAllOpportunities(req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Opportunities retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getOpportunityById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await OpportunityService.getOpportunityById(id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Opportunity details retrieved successfully',
    data: result,
  })
})

const updateOpportunity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await OpportunityService.updateOpportunity(
    id,
    user.userId,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Opportunity updated successfully',
    data: result,
  })
})

const closeOpportunity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await OpportunityService.closeOpportunity(id, user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

export const OpportunityController = {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  closeOpportunity,
}
