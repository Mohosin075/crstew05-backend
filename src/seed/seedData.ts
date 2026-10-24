import mongoose from 'mongoose'
import config from '../config'
import { User } from '../app/modules/user/user.model'
import { Organization } from '../app/modules/organization/organization.model'
import { Opportunity } from '../app/modules/opportunity/opportunity.model'
import { Candidate } from '../app/modules/candidate/candidate.model'
import { Verification } from '../app/modules/verification/verification.model'
import {
  CAREER_STATUS,
  USER_ROLES,
  USER_STATUS,
  VERIFICATION_STATUS,
} from '../enum/user'
import {
  BILLING_CYCLE,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from '../enum/subscription'
import { SubscriptionModel } from '../app/modules/subscription/subscription.model'


const seed = async () => {
  try {
    console.log('Connecting to database for seeding...')
    await mongoose.connect(config.database_url as string)
    console.log('Connected to MongoDB.')

    // 1. Create Collegiate Org Owner
    const orgOwnerEmail = 'recruiter@texasathletics.edu'
    let orgOwner = await User.findOne({ email: orgOwnerEmail })
    if (!orgOwner) {
      orgOwner = await User.create({
        name: 'Chris Del Conte',
        fullName: 'Chris Del Conte',
        email: orgOwnerEmail,
        password: 'Password123!',
        role: USER_ROLES.COLLEGIATE,
        status: USER_STATUS.ACTIVE,
        verified: true,
        address: { city: 'Austin', country: 'USA' },
      })
      console.log('Created Org Owner:', orgOwner.email)
    }

    // 2. Create Organization
    let org = await Organization.findOne({ owner: orgOwner._id })
    if (!org) {
      org = await Organization.create({
        name: 'Texas Longhorns Football',
        type: 'collegiate_program',
        role: USER_ROLES.COLLEGIATE,
        school: 'University of Texas at Austin',
        conference: 'SEC',
        division: 'FBS',
        location: 'Austin, TX',
        state: 'TX',
        website: 'https://texassports.com',
        description:
          'Official collegiate recruiting and athletic department for Texas Longhorns Football.',
        isVerified: true,
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        isFounding: true,
        owner: orgOwner._id,
        members: [
          {
            user: orgOwner._id,
            role: 'admin',
            joinedAt: new Date(),
            lastActive: new Date(),
          },
        ],
        subscription: {
          plan: 'org_pro',
          status: 'active',
        },
      })
      await User.findByIdAndUpdate(orgOwner._id, { organizationId: org._id })
      console.log('Created Organization:', org.name)
    }

    // 3. Create Sample Realistic Coaches
    const sampleCoaches = [
      {
        name: 'Marcus Vance',
        fullName: 'Marcus Vance',
        email: 'marcus.vance@tcpcoach.com',
        role: USER_ROLES.COACH,
        status: USER_STATUS.ACTIVE,
        verified: true,
        isPro: true,
        identityVerification: VERIFICATION_STATUS.VERIFIED,
        experienceVerification: VERIFICATION_STATUS.VERIFIED,
        currentRole: 'Offensive Coordinator',
        currentOrganization: 'Boise State',
        highestLevel: 'FBS',
        yearsExperience: 14,
        careerStatus: CAREER_STATUS.OPEN_TO_OPPORTUNITIES,
        headline: 'Dynamic Play-Caller | Air Raid & Zone Run Specialist',
        bio: '14 years of collegiate coaching experience with top-15 national offenses. Focused on QB development and explosive passing concepts.',
        coachingPhilosophy:
          'Play fast, execute with disciplined fundamentals, and empower student-athletes to maximize their ceiling both on and off the field.',
        expertise: {
          primary: ['Offensive Coordinator', 'Quarterbacks'],
          secondary: ['Passing Game Coordinator'],
          schemes: ['Air Raid', 'Zone Run', 'RPO'],
        },
        address: { city: 'Boise', country: 'USA' },
        recruitingFootprint: {
          description: 'Deep ties across Texas, California, and the Pacific Northwest',
          mapStates: ['TX', 'CA', 'ID', 'WA', 'AZ'],
          topStates: [
            { state: 'TX', level: 'High', percentage: 45 },
            { state: 'CA', level: 'High', percentage: 35 },
            { state: 'ID', level: 'Med', percentage: 20 },
          ],
        },
        experienceList: [
          {
            role: 'Offensive Coordinator / QBs',
            organization: 'Boise State',
            level: 'FBS',
            startYear: 2021,
            isCurrentRole: true,
            highlights: ['Top 10 Scoring Offense (2023)', 'Mountain West Championship'],
          },
          {
            role: 'Passing Game Coordinator',
            organization: 'Washington State',
            level: 'FBS',
            startYear: 2017,
            endYear: 2020,
            isCurrentRole: false,
            highlights: ['Pac-12 Leader in Passing Yards'],
          },
        ],
        credentialsList: [
          {
            name: 'AFCA Master Coach Certification',
            issuingBody: 'American Football Coaches Association',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
          },
          {
            name: 'NCAA Division I Recruiting Compliance',
            issuingBody: 'NCAA',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
          },
        ],
      },
      {
        name: 'Derrick Henderson',
        fullName: 'Derrick Henderson',
        email: 'derrick.henderson@tcpcoach.com',
        role: USER_ROLES.COACH,
        status: USER_STATUS.ACTIVE,
        verified: true,
        isPro: true,
        identityVerification: VERIFICATION_STATUS.VERIFIED,
        experienceVerification: VERIFICATION_STATUS.VERIFIED,
        currentRole: 'Defensive Coordinator',
        currentOrganization: 'Tulane',
        highestLevel: 'FBS',
        yearsExperience: 16,
        careerStatus: CAREER_STATUS.ACTIVELY_LOOKING,
        headline: 'Aggressive 4-2-5 Defense | Proven Turnover Creator',
        bio: 'Architect of multiple top-20 scoring defenses. Specializes in secondary communication, third-down pressure packages, and defensive back technical development.',
        coachingPhilosophy:
          'Relentless effort, violent pursuit to the football, and creating havoc in the backfield.',
        expertise: {
          primary: ['Defensive Coordinator', 'Safeties'],
          secondary: ['Defensive Backs'],
          schemes: ['4-2-5', 'Odd Front', 'Match Quarters'],
        },
        address: { city: 'New Orleans', country: 'USA' },
        recruitingFootprint: {
          description: 'Extensive pipeline through Louisiana, Georgia, and Florida',
          mapStates: ['LA', 'GA', 'FL', 'TX', 'AL'],
          topStates: [
            { state: 'LA', level: 'High', percentage: 50 },
            { state: 'GA', level: 'High', percentage: 30 },
            { state: 'FL', level: 'Med', percentage: 20 },
          ],
        },
        experienceList: [
          {
            role: 'Defensive Coordinator',
            organization: 'Tulane',
            level: 'FBS',
            startYear: 2022,
            isCurrentRole: true,
            highlights: ['Cotton Bowl Champions', '#1 Turnover Margin in AAC'],
          },
        ],
        credentialsList: [
          {
            name: 'NCAA Division I Recruiting Certification',
            issuingBody: 'NCAA',
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
          },
        ],
      },
      {
        name: 'Tyler Brooks',
        fullName: 'Tyler Brooks',
        email: 'tyler.brooks@tcpcoach.com',
        role: USER_ROLES.COACH,
        status: USER_STATUS.ACTIVE,
        verified: false,
        isPro: false,
        identityVerification: VERIFICATION_STATUS.PENDING,
        experienceVerification: VERIFICATION_STATUS.UNVERIFIED,
        currentRole: 'Wide Receivers Coach',
        currentOrganization: 'North Texas',
        highestLevel: 'FBS',
        yearsExperience: 6,
        careerStatus: CAREER_STATUS.ACTIVELY_LOOKING,
        headline: 'Elite Route-Running & Release Specialist | Texas High School Pipeline',
        bio: 'Former collegiate wide receiver turned dynamic position coach. Mentored 3 All-Conference selections.',
        coachingPhilosophy:
          'Detail-oriented route precision, unselfish perimeter blocking, and game-changing perimeter play.',
        expertise: {
          primary: ['Wide Receivers'],
          secondary: ['Special Teams'],
          schemes: ['Spread', 'Air Raid'],
        },
        address: { city: 'Denton', country: 'USA' },
        recruitingFootprint: {
          description: 'DFW Metroplex and East Texas High School ties',
          mapStates: ['TX', 'OK', 'LA'],
          topStates: [{ state: 'TX', level: 'High', percentage: 80 }],
        },
      },
    ]

    const coachDocs: any[] = []
    for (const c of sampleCoaches) {
      let coach = await User.findOne({ email: c.email })
      if (!coach) {
        coach = await User.create({
          ...c,
          password: 'Password123!',
        })
        console.log('Created Coach:', coach.name)
      }
      coachDocs.push(coach)

      // Create Coach Pro subscription record if isPro
      if (coach.isPro) {
        await SubscriptionModel.findOneAndUpdate(
          { subscriberId: coach._id, subscriberType: 'user' },
          {
            subscriberType: 'user',
            subscriberId: coach._id,
            plan: SUBSCRIPTION_PLAN.COACH_PRO,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            price: 19.88,
            currency: 'usd',
            billingCycle: BILLING_CYCLE.MONTHLY,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            isFounding: false,
          },
          { upsert: true },
        )
      }
    }

    // Seed Org Pro subscription
    await SubscriptionModel.findOneAndUpdate(
      { subscriberId: org._id, subscriberType: 'organization' },
      {
        subscriberType: 'organization',
        subscriberId: org._id,
        plan: SUBSCRIPTION_PLAN.ORG_PRO,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        price: 499.0,
        currency: 'usd',
        billingCycle: BILLING_CYCLE.MONTHLY,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        isFounding: true,
      },
      { upsert: true },
    )


    // 4. Create Sample Opportunities
    const sampleOpportunities = [
      {
        title: 'Offensive Coordinator / Quarterbacks',
        position: 'Offensive Coordinator',
        level: 'FBS',
        type: 'full_time' as const,
        location: 'Austin, TX',
        description:
          'Seeking an elite, modern offensive strategist to lead game planning and direct collegiate quarterbacks at the highest level of FBS football.',
        requirements: [
          '5+ years coaching at FBS or FCS level',
          'Proven record of quarterback development',
          'Proficiency with modern RPO and tempo passing systems',
        ],
        preferredQualifications: [
          'Previous play-calling experience',
          'Proven recruiter in Texas and Florida',
        ],
        status: 'active' as const,
        isFeatured: true,
        isSponsored: true,
        isUrgent: true,
      },
      {
        title: 'Cornerbacks Coach / Pass Defense Specialist',
        position: 'Defensive Backs',
        level: 'FBS',
        type: 'full_time' as const,
        location: 'Austin, TX',
        description:
          'Responsible for coaching cornerbacks, defensive perimeter alignment, and coordinating red-zone pass defense.',
        requirements: [
          '3+ years collegiate defensive backs coaching experience',
          'Strong recruiter with proven footprint',
        ],
        status: 'active' as const,
        isFeatured: false,
        isSponsored: false,
        isUrgent: false,
      },
    ]

    const oppDocs: any[] = []
    for (const opp of sampleOpportunities) {
      let existingOpp = await Opportunity.findOne({
        title: opp.title,
        organizationId: org._id,
      })
      if (!existingOpp) {
        existingOpp = await Opportunity.create({
          ...opp,
          organizationId: org._id,
          organizationName: org.name,
          organizationLogoUrl: org.logoUrl,
          postedBy: orgOwner._id,
          postedByRole: USER_ROLES.COLLEGIATE,
          postedAt: new Date(),
          viewCount: 142,
          expressInterestCount: 2,
        })
        console.log('Created Opportunity:', existingOpp.title)
      }
      oppDocs.push(existingOpp)
    }

    // 5. Create Candidate Pipeline Records (ATS Stages)
    if (coachDocs.length > 0 && oppDocs.length > 0) {
      // Stage: interested
      const candidate1 = await Candidate.findOne({
        coachId: coachDocs[0]._id,
        opportunityId: oppDocs[0]._id,
      })
      if (!candidate1) {
        await Candidate.create({
          coachId: coachDocs[0]._id,
          opportunityId: oppDocs[0]._id,
          organizationId: org._id,
          pipelineStage: 'interested',
          internalRating: 5,
          internalNotes: 'Top target. High recommendations from conference AD.',
          matchScore: 96,
          discoveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastUpdatedAt: new Date(),
          expressInterestAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          expressInterestMessage:
            'Extremely excited about the offensive vision in Austin. Looking forward to connecting with the staff.',
          coachSnapshot: {
            id: coachDocs[0]._id.toString(),
            name: coachDocs[0].name,
            avatarUrl: coachDocs[0].profile || '',
            isVerified: true,
            position: coachDocs[0].currentRole,
            university: coachDocs[0].currentOrganization,
            level: coachDocs[0].highestLevel,
            experienceYears: coachDocs[0].yearsExperience,
            location: coachDocs[0].address?.city || '',
          },
        })
        console.log('Created Candidate (Interested):', coachDocs[0].name)
      }

      // Stage: interview
      if (coachDocs[1]) {
        const candidate2 = await Candidate.findOne({
          coachId: coachDocs[1]._id,
          opportunityId: oppDocs[0]._id,
        })
        if (!candidate2) {
          await Candidate.create({
            coachId: coachDocs[1]._id,
            opportunityId: oppDocs[0]._id,
            organizationId: org._id,
            pipelineStage: 'interview',
            internalRating: 4,
            internalNotes: 'Zoom interview completed on Tuesday. Board presentation scheduled.',
            matchScore: 91,
            discoveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastUpdatedAt: new Date(),
            expressInterestAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            coachSnapshot: {
              id: coachDocs[1]._id.toString(),
              name: coachDocs[1].name,
              avatarUrl: coachDocs[1].profile || '',
              isVerified: true,
              position: coachDocs[1].currentRole,
              university: coachDocs[1].currentOrganization,
              level: coachDocs[1].highestLevel,
              experienceYears: coachDocs[1].yearsExperience,
              location: coachDocs[1].address?.city || '',
            },
          })
          console.log('Created Candidate (Interview):', coachDocs[1].name)
        }
      }
    }

    // 6. Create Verification Queue Item
    if (coachDocs[2]) {
      const existingVerif = await Verification.findOne({
        entityId: coachDocs[2]._id,
      })
      if (!existingVerif) {
        await Verification.create({
          entityId: coachDocs[2]._id,
          entityType: 'coach_identity',
          entityName: coachDocs[2].name,
          submittedBy: coachDocs[2]._id,
          status: 'pending',
          priority: 'high',
          submittedAt: new Date(),
          documents: [
            {
              name: 'State_Drivers_License.pdf',
              url: 'https://tcp-uploads.s3.amazonaws.com/verifications/sample_id.pdf',
              uploadedAt: new Date(),
              mimeType: 'application/pdf',
            },
          ],
        })
        console.log('Created Verification Queue Item for:', coachDocs[2].name)
      }
    }

    // 8. Seed Dashboard 1-Click Demo Accounts (matching ROLES_CONFIG)
    const portalAccounts = [
      {
        email: 'admin@thecoachprofile.com',
        name: 'Jordan Davis',
        password: 'adminpassword123',
        role: USER_ROLES.SUPER_ADMIN,
        orgName: 'TCP Platform Administration',
        orgType: 'organization',
      },
      {
        email: 'collegiate@thecoachprofile.com',
        name: 'Sarah Johnson',
        password: 'collegiatepass123',
        role: USER_ROLES.COLLEGIATE,
        orgName: 'Texas Longhorns Athletics',
        orgType: 'collegiate_program',
      },
      {
        email: 'teams@thecoachprofile.com',
        name: 'Marcus Vance',
        password: 'teamspassword123',
        role: USER_ROLES.TEAM,
        orgName: 'Dallas Football Operations',
        orgType: 'professional_team',
      },
      {
        email: 'agency@thecoachprofile.com',
        name: 'Marcus Vance',
        password: 'agencypassword123',
        role: USER_ROLES.AGENCY,
        orgName: 'Elite Coaching Search Group',
        orgType: 'recruiting_agency',
      },
      {
        email: 'org@thecoachprofile.com',
        name: 'Nathan Fox',
        password: 'orgpassword123',
        role: USER_ROLES.ORGANIZATION,
        orgName: 'National Football Coaches Association',
        orgType: 'organization',
      },
    ]

    for (const acc of portalAccounts) {
      let user = await User.findOne({ email: acc.email })
      if (!user) {
        user = await User.create({
          name: acc.name,
          fullName: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          status: USER_STATUS.ACTIVE,
          verified: true,
          address: { city: 'Austin', country: 'USA' },
        })
        console.log(`Created Portal User: ${acc.email} (${acc.role})`)
      }

      if (acc.role !== USER_ROLES.SUPER_ADMIN) {
        let userOrg = await Organization.findOne({ owner: user._id })
        if (!userOrg) {
          userOrg = await Organization.create({
            name: acc.orgName,
            type: acc.orgType,
            role: acc.role,
            location: 'Austin, TX',
            state: 'TX',
            isVerified: true,
            verificationStatus: VERIFICATION_STATUS.VERIFIED,
            isFounding: true,
            owner: user._id,
            members: [
              {
                user: user._id,
                role: 'admin',
                joinedAt: new Date(),
                lastActive: new Date(),
              },
            ],
            subscription: {
              plan: 'org_pro',
              status: 'active',
            },
          })
          await User.findByIdAndUpdate(user._id, { organizationId: userOrg._id })
          console.log(`Created Organization for ${acc.email}: ${userOrg.name}`)
        }
      }
    }

    console.log('✅ Demo seeding finished successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

seed()
