import { Schema, model } from 'mongoose'
import { IShortlist, ShortlistModel } from './shortlist.interface'

const ShortlistSchema = new Schema<IShortlist, ShortlistModel>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    coaches: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

ShortlistSchema.index({ organizationId: 1, name: 1 })
ShortlistSchema.index({ coaches: 1 })
ShortlistSchema.index({ createdBy: 1 })

export const Shortlist = model<IShortlist, ShortlistModel>(
  'Shortlist',
  ShortlistSchema,
)
