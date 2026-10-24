import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { CandidateService } from './candidate.service'
import { JwtPayload } from 'jsonwebtoken'

const getAll = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await CandidateService.getAll(user.userId, req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Candidates retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getPipelineBoard = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const opportunityId = req.query.opportunityId as string | undefined
  const result = await CandidateService.getPipelineBoard(
    user.userId,
    opportunityId,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Pipeline board retrieved successfully',
    data: result,
  })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await CandidateService.getById(id, user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Candidate record retrieved successfully',
    data: result,
  })
})

const updateStage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { stage } = req.body
  const result = await CandidateService.updateStage(id, stage, user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const addNote = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { content } = req.body
  const result = await CandidateService.addNote(id, user.userId, content)
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Note added successfully',
    data: result,
  })
})

const getNotes = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const result = await CandidateService.getNotes(id, user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notes retrieved successfully',
    data: result,
  })
})

const updateRating = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { id } = req.params
  const { rating } = req.body
  const result = await CandidateService.updateRating(id, rating, user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const expressInterest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { opportunityId, sharedFields, message } = req.body
  const result = await CandidateService.expressInterest(
    user.userId,
    opportunityId,
    {
      sharedFields,
      message,
    },
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  })
})

const getExpressInterests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const opportunityId = req.query.opportunityId as string | undefined
  const result = await CandidateService.getExpressInterests(
    user.userId,
    opportunityId,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Express interest candidates retrieved successfully',
    data: result,
  })
})

const getShortlists = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await CandidateService.getShortlists(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shortlists retrieved successfully',
    data: result,
  })
})

const createShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { name } = req.body
  const result = await CandidateService.createShortlist(user.userId, name)
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Shortlist created successfully',
    data: result,
  })
})

const addToShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { shortlistId, coachId } = req.params
  const result = await CandidateService.addToShortlist(
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

const removeFromShortlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { shortlistId, coachId } = req.params
  const result = await CandidateService.removeFromShortlist(
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

export const CandidateController = {
  getAll,
  getPipelineBoard,
  getById,
  updateStage,
  addNote,
  getNotes,
  updateRating,
  expressInterest,
  getExpressInterests,
  getShortlists,
  createShortlist,
  addToShortlist,
  removeFromShortlist,
}

