import { Model, Types } from 'mongoose'

export interface IShortlist {
  _id: Types.ObjectId
  organizationId: Types.ObjectId
  name: string
  description?: string
  coaches: Types.ObjectId[]
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type ShortlistModel = Model<IShortlist>

export interface IShortlistItem {
  id: string
  name: string
  description?: string
  count: number
  createdAt: Date
}
