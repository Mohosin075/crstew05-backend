import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { OrganizationService } from './organization.service'
import { JwtPayload } from 'jsonwebtoken'

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await OrganizationService.createOrganization(
    user.userId,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Organization created successfully',
    data: result,
  })
})

const getCurrentOrganization = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const result = await OrganizationService.getCurrentOrganization(user.userId)
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Current organization retrieved successfully',
      data: result,
    })
  },
)

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await OrganizationService.updateOrganization(
    user.userId,
    req.body,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organization updated successfully',
    data: result,
  })
})

const getMembers = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await OrganizationService.getMembers(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Team members retrieved successfully',
    data: result,
  })
})

const inviteMember = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { email, role } = req.body
  const result = await OrganizationService.inviteMember(
    user.userId,
    email,
    role,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Invitation sent successfully',
    data: result,
  })
})

const removeMember = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { memberId } = req.params
  const result = await OrganizationService.removeMember(user.userId, memberId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { memberId } = req.params
  const { role } = req.body
  const result = await OrganizationService.updateMemberRole(
    user.userId,
    memberId,
    role,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getAllOrganizations(req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Organizations retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

export const OrganizationController = {
  createOrganization,
  getCurrentOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  getAllOrganizations,
}
