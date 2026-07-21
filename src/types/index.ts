// ─── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; fullName: string; role: string }
export interface AuthResponse {
  token: string; userId: string; email: string; fullName: string; role: string
}

// ─── Review Round ──────────────────────────────────────────────────────────
export type RoundStatus = 'Draft' | 'RegistrationOpen' | 'Scheduling' | 'Published' | 'Completed'

export interface ReviewRoundDto {
  id: string; name: string; semester: string
  registrationStartDate: string; registrationEndDate: string
  status: RoundStatus; maxGroupsPerSlot: number
  requiredLecturersPerSlot: number; totalSlots: number
}

export interface CreateReviewRoundPayload {
  name: string; semester: string
  registrationStartDate: string; registrationEndDate: string
  maxGroupsPerSlot: number; requiredLecturersPerSlot: number
}

// ─── Review Slot ───────────────────────────────────────────────────────────
export interface ReviewSlotDto {
  id: string; reviewRoundId: string; date: string
  startTime: string; endTime: string
}

export interface CreateSlotPayload {
  date: string; startTime: string; endTime: string
}

// ─── Lecturer ──────────────────────────────────────────────────────────────
export interface LecturerDto {
  id: string; userId: string; fullName: string; email: string; department: string
}

export interface InvitationDto {
  id: string; reviewRoundId: string; reviewRoundName: string
  status: 'Pending' | 'Accepted' | 'Declined'; invitedAt: string
}

// ─── Group ─────────────────────────────────────────────────────────────────
export interface GroupDto {
  id: string; name: string; projectTitle: string; semester: string; memberCount: number
}

// ─── Schedule ──────────────────────────────────────────────────────────────
export interface ScheduleDetailDto {
  id: string; date: string; startTime: string; endTime: string
  roomName: string | null; isPublished: boolean; isCompleted: boolean
  lecturers: string[]; groups: string[]
}

export interface ScheduleSummaryDto {
  totalScheduled: number; totalGroups: number; unscheduledGroups: number
}

// ─── Feedback ──────────────────────────────────────────────────────────────
export interface SubmitFeedbackPayload {
  reviewScheduleId: string; groupId: string; lecturerId: string
  comments: string; recommendations: string; evaluationNotes: string
}

// ─── Room ──────────────────────────────────────────────────────────────────
export interface RoomDto { id: string; name: string; capacity: number | null }

// ─── Report ────────────────────────────────────────────────────────────────
export interface ReviewReportDto {
  reviewRoundId: string; reviewRoundName: string
  totalGroups: number; totalLecturers: number; totalSlots: number
  scheduledGroups: number; schedulingSuccessRate: number
  slotUtilizationRate: number
  lecturerWorkloads: { lecturerName: string; assignedReviews: number }[]
}

export interface LecturerWorkloadDto {
  lecturerId: string; lecturerName: string
  department: string; assignedReviews: number
}

export interface GrpcRoundReportDto {
  reviewRoundId: string; reviewRoundName: string
  totalGroups: number; totalLecturers: number; totalSlots: number
  scheduledGroups: number; schedulingSuccessRate: number; slotUtilizationRate: number
}

// ─── System / Monitoring ────────────────────────────────────────────────────
export interface SystemEventDto {
  timestamp: string; source: string; channel: string; message: string
}

export interface JobRunResultDto {
  schedulesProcessed: number; remindersSent: number
  staleCleaned: number; ranAt: string
}

export interface SystemStatusDto {
  redisConnected: boolean
  lastJobRun: JobRunResultDto | null
  eventCount: number
}

// ─── API Wrapper ───────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean; message: string; data: T; errors: string[]
}
