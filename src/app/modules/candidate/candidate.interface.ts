import { Model, Types } from 'mongoose'

export type PipelineStage =
  | 'discovered'
  | 'saved'
  | 'contacted'
  | 'interested'
  | 'interview'
  | 'offer'
  | 'hired'

export interface ICandidateNote {
  _id?: Types.ObjectId
  candidateId: Types.ObjectId
  authorId: Types.ObjectId
  authorName: string
  content: string
  createdAt: Date
}

export interface ICandidateSnapshot {
  id: string
  name: string
  avatarUrl?: string
  isVerified: boolean
  position: string
  university: string
  level: string
  experienceYears: number
  location: string
}

export interface ICandidateRecord {
  _id: Types.ObjectId
  coachId: Types.ObjectId
  opportunityId?: Types.ObjectId
  organizationId: Types.ObjectId

  pipelineStage: PipelineStage

  internalRating?: number
  internalNotes?: string
  notesList: ICandidateNote[]
  assignedRecruiter?: string
  lastContacted?: string

  matchScore?: number
  matchBreakdown?: {
    category: string
    strength: string
    percentage: number
  }[]

  discoveredAt: Date
  lastUpdatedAt: Date

  expressInterestAt?: Date
  expressInterestMessage?: string
  sharedFields?: {
    shareContactInfo: boolean
    shareCareerHistory: boolean
    shareCredentials: boolean
    shareRecruitingFootprint: boolean
  }

  coachSnapshot: ICandidateSnapshot

  createdAt: Date
  updatedAt: Date
}

export type CandidateModel = Model<ICandidateRecord>
