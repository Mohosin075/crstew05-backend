import { Schema, model } from 'mongoose'
import {
  IAnalyticsEvent,
  AnalyticsEventModel,
} from './analytics.interface'

const AnalyticsEventSchema = new Schema<
  IAnalyticsEvent,
  AnalyticsEventModel
>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    eventType: { type: String, required: true },
    entityId: { type: String },
    entityType: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
)

AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 })
AnalyticsEventSchema.index({ organizationId: 1, timestamp: -1 })
AnalyticsEventSchema.index({ userId: 1, eventType: 1 })

export const AnalyticsEvent = model<IAnalyticsEvent, AnalyticsEventModel>(
  'AnalyticsEvent',
  AnalyticsEventSchema,
)
