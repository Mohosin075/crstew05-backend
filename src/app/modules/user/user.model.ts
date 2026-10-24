import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'
import { IUser, UserModel } from './user.interface'
import { CAREER_STATUS, USER_ROLES, USER_STATUS, VERIFICATION_STATUS } from '../../../enum/user'

// ------------------ SUB-SCHEMAS ------------------
const CoachExperienceSchema = new Schema(
  {
    role: { type: String, required: true },
    organization: { type: String, required: true },
    level: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number },
    isCurrentRole: { type: Boolean, default: false },
    highlights: { type: [String], default: [] },
    divisionBadge: { type: String },
  },
  { _id: true },
)

const CoachEducationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true },
  },
  { _id: true },
)

const CoachCredentialSchema = new Schema(
  {
    name: { type: String, required: true },
    issuingBody: { type: String },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    documentUrl: { type: String },
  },
  { _id: true },
)

const RecruitingFootprintSchema = new Schema(
  {
    description: { type: String },
    mapStates: { type: [String], default: [] },
    topStates: [
      {
        state: { type: String, required: true },
        level: { type: String, enum: ['High', 'Med', 'Low'], default: 'Med' },
        percentage: { type: Number, default: 0 },
      },
    ],
  },
  { _id: false },
)

// ------------------ USER SCHEMA ------------------
const UserSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, trim: true },
    fullName: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    profile: { type: String, default: '' },
    phone: { type: String },
    description: { type: String },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: { type: Boolean, default: false },

    address: {
      city: String,
      postalCode: String,
      country: String,
      permanentAddress: String,
      presentAddress: String,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
      },
    },
    subscribe: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    stripeConnectedAccountId: { type: String },
    isStripeConnected: { type: Boolean, default: false },
    subscriptionStatus: { type: String },
    subscriptionTier: { type: String },
    trialUsed: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },

    password: { type: String, minlength: 6 },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    appId: { type: String },
    provider: { type: String },
    deviceToken: { type: String },
    timezone: { type: String, default: 'UTC' },
    isOnboardingComplete: { type: Boolean, default: false },

    // --- COACH SPECIFIC PROFILE DATA ---
    headline: { type: String, trim: true },
    bio: { type: String },
    coachingPhilosophy: { type: String },
    currentRole: { type: String, trim: true },
    currentOrganization: { type: String, trim: true },
    highestLevel: { type: String, trim: true },
    yearsExperience: { type: Number, default: 0 },
    careerStatus: {
      type: String,
      enum: Object.values(CAREER_STATUS),
      default: CAREER_STATUS.ACTIVELY_LOOKING,
    },
    isPro: { type: Boolean, default: false },
    isProCertified: { type: Boolean, default: false },
    identityVerification: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    experienceVerification: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    credentialsVerification: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    profileCompletionPercent: { type: Number, default: 0 },
    profileProgress: { type: Number, default: 0 },

    expertise: {
      primary: { type: [String], default: [] },
      secondary: { type: [String], default: [] },
      schemes: { type: [String], default: [] },
    },

    careerPreferences: {
      desiredPositions: { type: [String], default: [] },
      desiredLevels: { type: [String], default: [] },
      preferredRegions: { type: [String], default: [] },
      isOpenToRelocation: { type: Boolean, default: false },
      notes: { type: String },
    },

    recruitingFootprint: RecruitingFootprintSchema,
    experienceList: [CoachExperienceSchema],
    educationList: [CoachEducationSchema],
    credentialsList: [CoachCredentialSchema],

    // Privacy & Contact controls
    allowsRecruiterContact: { type: Boolean, default: true },
    profileVisibility: {
      type: String,
      enum: ['public', 'network_only', 'private'],
      default: 'public',
    },
    resumeUrl: { type: String },

    // Organization linkage & recruitment bookmarks
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    savedCoaches: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    settings: {
      pushNotification: { type: Boolean, default: true },
      emailNotification: { type: Boolean, default: true },
      locationService: { type: Boolean, default: true },
      profileStatus: { type: String, default: 'public' },
      smsNotification: { type: Boolean, default: true },
      dndMode: { type: Boolean, default: false },
      quietHoursEnabled: { type: Boolean, default: true },
      quietHoursStart: { type: String, default: '22:00' },
      quietHoursEnd: { type: String, default: '08:00' },
      disabledCategories: { type: [String], default: [] },
    },

    authentication: {
      restrictionLeftAt: { type: Date, default: null },
      resetPassword: { type: Boolean, default: false },
      wrongLoginAttempts: { type: Number, default: 0 },
      passwordChangedAt: { type: Date },
      oneTimeCode: { type: String },
      latestRequestAt: { type: Date, default: Date.now },
      expiresAt: { type: Date },
      requestCount: { type: Number, default: 0 },
      authType: { type: String, enum: ['createAccount', 'resetPassword'] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES (Production Grade Optimization) ------------------
UserSchema.index({ location: '2dsphere' })
UserSchema.index({ verified: 1, createdAt: 1 })
UserSchema.index({ role: 1, status: 1 })
UserSchema.index({ role: 1, careerStatus: 1 })
UserSchema.index({ role: 1, highestLevel: 1 })
UserSchema.index({ role: 1, currentRole: 1 })
UserSchema.index({ role: 1, 'address.city': 1 })
UserSchema.index({ role: 1, isPro: 1 })
UserSchema.index({ role: 1, 'expertise.primary': 1 })
UserSchema.index({ role: 1, 'careerPreferences.desiredPositions': 1 })
UserSchema.index({ organizationId: 1, role: 1 })

// ------------------ PRE HOOKS ------------------
UserSchema.pre('save', async function (next) {
  // Password hashing
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10)
  }

  // Auto-calculate Profile Completion Percentage for Coaches
  if (this.role === USER_ROLES.COACH) {
    let score = 0
    if (this.name || this.fullName) score += 10
    if (this.email) score += 10
    if (this.profile) score += 10
    if (this.headline || this.bio) score += 10
    if (this.coachingPhilosophy) score += 10
    if (this.currentRole) score += 10
    if (this.expertise?.primary?.length) score += 10
    if (this.experienceList?.length) score += 15
    if (this.credentialsList?.length) score += 10
    if (this.careerPreferences?.desiredPositions?.length) score += 5

    this.profileCompletionPercent = Math.min(score, 100)
    this.profileProgress = this.profileCompletionPercent
  }

  next()
})

// ------------------ STATIC METHODS ------------------
UserSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(givenPassword, savedPassword)
}

// ------------------ MODEL ------------------
export const User = model<IUser, UserModel>('User', UserSchema)

