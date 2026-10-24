import { Schema, model, Model, Types } from 'mongoose'
import {
  BILLING_CYCLE,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../../../enum/subscription'

export interface ISubscriptionHistory {
  action: string
  plan: SUBSCRIPTION_PLAN
  status: SUBSCRIPTION_STATUS
  timestamp: Date
  note?: string
}

export interface ISubscriptionDoc {
  _id: Types.ObjectId
  subscriberType: 'user' | 'organization'
  subscriberId: Types.ObjectId
  plan: SUBSCRIPTION_PLAN
  status: SUBSCRIPTION_STATUS
  price: number
  currency: string
  billingCycle: BILLING_CYCLE
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  isFounding: boolean
  history: ISubscriptionHistory[]
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionDocModel = Model<ISubscriptionDoc>

const SubscriptionSchema = new Schema<ISubscriptionDoc, SubscriptionDocModel>(
  {
    subscriberType: {
      type: String,
      enum: ['user', 'organization'],
      required: true,
    },
    subscriberId: { type: Schema.Types.ObjectId, required: true },
    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLAN),
      default: SUBSCRIPTION_PLAN.FREE,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
    billingCycle: {
      type: String,
      enum: Object.values(BILLING_CYCLE),
      default: BILLING_CYCLE.MONTHLY,
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    isFounding: { type: Boolean, default: false },
    history: [
      {
        action: { type: String, required: true },
        plan: { type: String, required: true },
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

SubscriptionSchema.index({ subscriberId: 1, subscriberType: 1 }, { unique: true })
SubscriptionSchema.index({ status: 1, plan: 1 })
SubscriptionSchema.index({ stripeCustomerId: 1 })
SubscriptionSchema.index({ stripeSubscriptionId: 1 })

export const SubscriptionModel = model<ISubscriptionDoc, SubscriptionDocModel>(
  'Subscription',
  SubscriptionSchema,
)
