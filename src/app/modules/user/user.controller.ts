import { Request, Response } from 'express'

import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'

import { UserServices } from './user.service'
import pick from '../../../shared/pick'
import { paginationFields } from '../../../interfaces/pagination'
import { JwtPayload } from 'jsonwebtoken'
import ApiError from '../../../errors/ApiError'
import { userFilterableFields } from './user.constants'
import { IUser } from './user.interface'

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body)
  const { images, ...userData } = req.body

  if (images) {
    userData.profile = Array.isArray(images) ? images[0] : images
  }
  const result = await UserServices.updateProfile(req.user!, userData)
  sendResponse<String>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  })
})

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields)
  const filterables = pick(req.query, userFilterableFields)
  const result = await UserServices.getAllUsers(paginationOptions, filterables)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await UserServices.deleteUser(userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  })
})

const deleteProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { password } = req.body

  if (!password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is required')
  }

  const result = await UserServices.deleteProfile(user.userId, password)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User profile deleted successfully',
    data: result,
  })
})

const deactivateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { password } = req.body

  if (!password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is required')
  }

  const result = await UserServices.deactivateProfile(user.userId, password)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      'User profile deactivated successfully. You can reactivate by logging in again.',
    data: result,
  })
})

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await UserServices.getUserById(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  })
})

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const { status } = req.body
  if (!status) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Status is required')
  }
  const result = await UserServices.updateUserStatus(userId, status)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  })
})

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getProfile(req.user!)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  })
})

const downloadAccountData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await UserServices.downloadAccountData(user.userId)

  const filename = `account-data-${user.userId}.json`
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.status(StatusCodes.OK).send(JSON.stringify(result, null, 2))
})

const searchCoaches = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.searchCoaches(req.query)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Coaches retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getCoachById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await UserServices.getCoachById(id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Coach profile retrieved successfully',
    data: result,
  })
})

const getRecommendedCoaches = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5
    const result = await UserServices.getRecommendedCoaches(limit)
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Recommended coaches retrieved successfully',
      data: result,
    })
  },
)

const saveCoach = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { coachId } = req.params
  const result = await UserServices.toggleSaveCoach(user.userId, coachId, 'save')
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const unsaveCoach = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { coachId } = req.params
  const result = await UserServices.toggleSaveCoach(
    user.userId,
    coachId,
    'unsave',
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  })
})

const getSavedCoaches = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await UserServices.getSavedCoaches(user.userId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Saved coaches retrieved successfully',
    data: result,
  })
})

export const UserController = {
  updateProfile,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUserStatus,
  getProfile,
  deleteProfile,
  deactivateProfile,
  downloadAccountData,
  searchCoaches,
  getCoachById,
  getRecommendedCoaches,
  saveCoach,
  unsaveCoach,
  getSavedCoaches,
}

