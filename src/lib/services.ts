import api from './api'
import type {
  LoginRequest, RegisterRequest, AuthResponse,
  ReviewRoundDto, CreateReviewRoundPayload, RoundStatus,
  ReviewSlotDto, CreateSlotPayload,
  ScheduleSummaryDto, RoomDto, ReviewReportDto, GrpcRoundReportDto,
  ApiResponse
} from '@/types'

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/register', data),
}

// ─── Review Rounds ─────────────────────────────────────────────────────────
export const roundsApi = {
  getAll: () =>
    api.get<ApiResponse<ReviewRoundDto[]>>('/api/reviewrounds'),
  getById: (id: string) =>
    api.get<ApiResponse<ReviewRoundDto>>(`/api/reviewrounds/${id}`),
  create: (data: CreateReviewRoundPayload) =>
    api.post<ApiResponse<ReviewRoundDto>>('/api/reviewrounds', data),
  updateStatus: (id: string, status: RoundStatus) =>
    api.put<ApiResponse<ReviewRoundDto>>(`/api/reviewrounds/${id}/status`, status),
  getSlots: (id: string) =>
    api.get<ApiResponse<ReviewSlotDto[]>>(`/api/reviewrounds/${id}/slots`),
  createSlot: (id: string, data: CreateSlotPayload) =>
    api.post<ApiResponse<ReviewSlotDto>>(`/api/reviewrounds/${id}/slots`, data),
}

// ─── Lecturers ─────────────────────────────────────────────────────────────
export const lecturersApi = {
  invite: (reviewRoundId: string, lecturerId: string) =>
    api.post<ApiResponse<boolean>>('/api/lecturers/invite', { reviewRoundId, lecturerId }),
  respondInvitation: (invitationId: string, accept: boolean) =>
    api.post<ApiResponse<boolean>>('/api/lecturers/invitations/respond', { invitationId, accept }),
  registerAvailability: (lecturerId: string, reviewRoundId: string, slotIds: string[]) =>
    api.post<ApiResponse<boolean>>('/api/lecturers/availability', { lecturerId, reviewRoundId, slotIds }),
  setCompatibility: (reviewRoundId: string, lecturerAId: string, lecturerBId: string, score: number) =>
    api.post<ApiResponse<boolean>>('/api/lecturers/compatibility-score', {
      reviewRoundId, lecturerAId, lecturerBId, score
    }),
}

// ─── Groups ────────────────────────────────────────────────────────────────
export const groupsApi = {
  registerAvailability: (groupId: string, reviewRoundId: string, slotIds: string[]) =>
    api.post<ApiResponse<boolean>>('/api/groups/availability', { groupId, reviewRoundId, slotIds }),
}

// ─── Schedules ─────────────────────────────────────────────────────────────
export const schedulesApi = {
  generate: (reviewRoundId: string) =>
    api.post<ApiResponse<ScheduleSummaryDto>>('/api/schedules/generate', { reviewRoundId }),
  publish: (reviewRoundId: string) =>
    api.post<ApiResponse<boolean>>('/api/schedules/publish', { reviewRoundId }),
  assignRoom: (reviewScheduleId: string, roomId: string) =>
    api.post<ApiResponse<boolean>>('/api/schedules/assign-room', { reviewScheduleId, roomId }),
  complete: (reviewScheduleId: string) =>
    api.post<ApiResponse<boolean>>('/api/schedules/complete', { reviewScheduleId }),
  reassignGroup: (reviewScheduleId: string, groupId: string, newScheduleId: string) =>
    api.post<ApiResponse<boolean>>('/api/schedules/reassign-group', {
      reviewScheduleId, groupId, newScheduleId
    }),
}

// ─── Rooms ─────────────────────────────────────────────────────────────────
export const roomsApi = {
  getAll: () => api.get<RoomDto[]>('/api/rooms'),
  create: (name: string, capacity?: number) =>
    api.post<RoomDto>('/api/rooms', { name, capacity }),
}

// ─── Reports ───────────────────────────────────────────────────────────────
export const reportsApi = {
  getReport: (reviewRoundId: string) =>
    api.get<ApiResponse<ReviewReportDto>>(`/api/reports/${reviewRoundId}`),
}

// ─── gRPC Reports ──────────────────────────────────────────────────────────
export const grpcReportsApi = {
  getRoundReport: (reviewRoundId: string) =>
    api.get<{ success: boolean; source: string; data: GrpcRoundReportDto }>(
      `/api/grpc-reports/rounds/${reviewRoundId}/report`),
  getWorkload: (reviewRoundId: string) =>
    api.get<{ success: boolean; source: string; data: any[] }>(
      `/api/grpc-reports/rounds/${reviewRoundId}/workload`),
  getStatus: (reviewRoundId: string) =>
    api.get<{ success: boolean; source: string; data: any }>(
      `/api/grpc-reports/rounds/${reviewRoundId}/status`),
}
