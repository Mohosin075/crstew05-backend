export enum USER_ROLES {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COACH = 'coach',
  COLLEGIATE = 'collegiate',
  TEAM = 'team',
  AGENCY = 'agency',
  ORGANIZATION = 'organization',
  USER = 'user',
}

export enum USER_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export enum CAREER_STATUS {
  ACTIVELY_LOOKING = 'actively_looking',
  OPEN_TO_OPPORTUNITIES = 'open_to_opportunities',
  CURRENTLY_COACHING = 'currently_coaching',
  NOT_LOOKING = 'not_looking',
}

export enum VERIFICATION_STATUS {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  NEEDS_INFO = 'needs_info',
}

