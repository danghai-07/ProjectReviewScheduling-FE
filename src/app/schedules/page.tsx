'use client'
import { useEffect, useState } from 'react'
import {
  Select, Button, Card, Row, Col, Statistic, Tag, Space,
  Typography, message, Popconfirm, Alert, Badge, Form, Input
} from 'antd'
import {
  ThunderboltOutlined, SendOutlined,
  ScheduleOutlined, HomeOutlined, SwapOutlined, TeamOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, schedulesApi, roomsApi } from '@/lib/services'
import { FAP_COLORS, UUID_PATTERN } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRoundDto, ScheduleSummaryDto, RoomDto } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

export default function SchedulesPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [rooms, setRooms] = useState<RoomDto[]>([])
  const [summary, setSummary] = useState<ScheduleSummaryDto | null>(null)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [reassigningGroup, setReassigningGroup] = useState(false)
  const [reassigningLecturer, setReassigningLecturer] = useState(false)
  const [assignForm] = Form.useForm()
  const [reassignGroupForm] = Form.useForm()
  const [reassignLecturerForm] = Form.useForm()

  const isModerator = user?.role === 'Moderator'

  useEffect(() => {
    roundsApi.getAll().then(r => setRounds(r.data.data || []))
    roomsApi.getAll().then(r => setRooms(Array.isArray(r.data) ? r.data : []))
  }, [])

  const selectedRound = rounds.find(r => r.id === selectedRoundId)

  const handleGenerate = async () => {
    if (!selectedRoundId) return message.warning('Please select a review round')
    setGenerating(true)
    try {
      const res = await schedulesApi.generate(selectedRoundId)
      if (res.data.success) {
        setSummary(res.data.data)
        message.success('Schedule generated successfully!')
      } else {
        message.error(res.data.message)
      }
    } catch { message.error('Failed to generate schedule') }
    finally { setGenerating(false) }
  }

  const handlePublish = async () => {
    if (!selectedRoundId) return
    setPublishing(true)
    try {
      const res = await schedulesApi.publish(selectedRoundId)
      if (res.data.success) {
        message.success('Schedule published! Redis event fired → schedule:published')
        roundsApi.getAll().then(r => setRounds(r.data.data || []))
      } else {
        message.error(res.data.message)
      }
    } catch { message.error('Failed to publish schedule') }
    finally { setPublishing(false) }
  }

  // FR-09: Assign a room to a review schedule
  const handleAssignRoom = async (values: { reviewScheduleId: string; roomId: string }) => {
    setAssigning(true)
    try {
      const res = await schedulesApi.assignRoom(values.reviewScheduleId.trim(), values.roomId)
      if (res.data.success) {
        const room = rooms.find(r => r.id === values.roomId)
        message.success(`Room ${room?.name || ''} assigned to schedule!`)
        assignForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to assign room')
    } finally { setAssigning(false) }
  }

  // FR-07: Manually reassign a group to another schedule
  const handleReassignGroup = async (values: {
    reviewScheduleId: string; groupId: string; newScheduleId: string
  }) => {
    setReassigningGroup(true)
    try {
      const res = await schedulesApi.reassignGroup(
        values.reviewScheduleId.trim(),
        values.groupId.trim(),
        values.newScheduleId.trim()
      )
      if (res.data.success) {
        message.success('Group reassigned successfully!')
        reassignGroupForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to reassign group')
    } finally { setReassigningGroup(false) }
  }

  // FR-07: Manually reassign a lecturer to another schedule
  const handleReassignLecturer = async (values: {
    reviewScheduleId: string; lecturerId: string; newScheduleId: string
  }) => {
    setReassigningLecturer(true)
    try {
      const res = await schedulesApi.reassignLecturer(
        values.reviewScheduleId.trim(),
        values.lecturerId.trim(),
        values.newScheduleId.trim()
      )
      if (res.data.success) {
        message.success('Lecturer reassigned successfully!')
        reassignLecturerForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to reassign lecturer')
    } finally { setReassigningLecturer(false) }
  }

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><ScheduleOutlined /> Schedule Management</h2>
      </div>

      {/* Round selector */}
      <div className="page-card">
        <Row gutter={12} align="middle">
          <Col span={8}>
            <Text strong style={{ fontSize: 12 }}>Select Review Round:</Text>
            <Select
              style={{ width: '100%', marginTop: 6 }}
              placeholder="Choose a review round..."
              value={selectedRoundId || undefined}
              onChange={setSelectedRoundId}
              size="middle"
            >
              {rounds.map(r => (
                <Option key={r.id} value={r.id}>
                  <Space>
                    <span>{r.name}</span>
                    <Tag color="blue" style={{ fontSize: 10 }}>{r.semester}</Tag>
                    <Tag color={r.status === 'Published' ? 'green' : 'orange'}
                      style={{ fontSize: 10 }}>{r.status}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={16}>
            <Space style={{ marginTop: 24 }}>
              <Popconfirm
                title="Generate Schedule"
                description="This will overwrite existing unpublished schedules. Continue?"
                onConfirm={handleGenerate}
                okButtonProps={{ style: { background: FAP_COLORS.primary } }}
              >
                <Button
                  type="primary" icon={<ThunderboltOutlined />}
                  loading={generating} disabled={!selectedRoundId}
                  style={{ background: FAP_COLORS.primary }}
                >
                  Auto-Generate Schedule
                </Button>
              </Popconfirm>

              <Popconfirm
                title="Publish Schedule"
                description="Published schedules are visible to all. Redis event will fire."
                onConfirm={handlePublish}
              >
                <Button
                  icon={<SendOutlined />} loading={publishing}
                  disabled={!selectedRoundId}
                  style={{ borderColor: FAP_COLORS.secondary, color: FAP_COLORS.secondary }}
                >
                  Publish → Redis
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Summary after generation */}
      {summary && (
        <div className="page-card">
          <Alert
            type="success" showIcon
            message="Schedule Generated Successfully"
            description={`Redis event "schedule:generated" has been published to the message broker.`}
            style={{ marginBottom: 16 }}
          />
          <Row gutter={12}>
            <Col span={8}>
              <Card size="small" style={{ borderTop: `3px solid ${FAP_COLORS.primary}` }}>
                <Statistic title="Total Scheduled" value={summary.totalScheduled}
                  valueStyle={{ color: FAP_COLORS.primary }}
                  prefix={<ScheduleOutlined />} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
                <Statistic title="Total Groups" value={summary.totalGroups}
                  valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderTop: `3px solid ${summary.unscheduledGroups > 0 ? '#ff4d4f' : '#52c41a'}` }}>
                <Statistic title="Unscheduled Groups"
                  value={summary.unscheduledGroups}
                  valueStyle={{ color: summary.unscheduledGroups > 0 ? '#ff4d4f' : '#52c41a' }} />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Round info */}
      {selectedRound && (
        <div className="page-card">
          <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
            Round Information
          </Title>
          <Row gutter={16}>
            {[
              { label: 'Round Name', value: selectedRound.name },
              { label: 'Semester', value: selectedRound.semester },
              { label: 'Status', value: <Tag color={selectedRound.status === 'Published' ? 'green' : 'orange'}>{selectedRound.status}</Tag> },
              { label: 'Total Slots', value: <Badge count={selectedRound.totalSlots} showZero color="#003087" /> },
              { label: 'Max Groups/Slot', value: selectedRound.maxGroupsPerSlot },
              { label: 'Required Lecturers', value: selectedRound.requiredLecturersPerSlot },
            ].map(item => (
              <Col span={4} key={item.label}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{item.label}</Text>
                  <Text strong style={{ fontSize: 13 }}>{item.value}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* FR-09: Assign room to schedule */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
          <HomeOutlined /> Assign Room to Schedule
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Assign a room to a generated review schedule.
        </Text>

        {!isModerator && (
          <Alert type="warning" showIcon
            message="Only Moderators can assign rooms to schedules."
            style={{ marginBottom: 12 }} />
        )}

        <Form form={assignForm} layout="inline" onFinish={handleAssignRoom}>
          <Form.Item
            name="reviewScheduleId"
            rules={[
              { required: true, message: 'Schedule ID is required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
            style={{ flex: 1, minWidth: 320 }}
          >
            <Input placeholder="Review Schedule ID (UUID) — e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6" />
          </Form.Item>
          <Form.Item
            name="roomId"
            rules={[{ required: true, message: 'Please select a room' }]}
          >
            <Select placeholder="Select room..." style={{ width: 200 }}>
              {rooms.map(room => (
                <Option key={room.id} value={room.id}>
                  <Space>
                    <HomeOutlined style={{ color: FAP_COLORS.primary }} />
                    <span>{room.name}</span>
                    {room.capacity && <Tag color="blue" style={{ fontSize: 10 }}>Cap: {room.capacity}</Tag>}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Button
            type="primary" htmlType="submit"
            icon={<HomeOutlined />} loading={assigning}
            disabled={!isModerator}
            style={{ background: FAP_COLORS.primary }}
          >
            Assign Room
          </Button>
        </Form>
      </div>

      {/* FR-07: Reassign Group */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
          <SwapOutlined /> Reassign Group (Manual Adjustment)
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Move a group from its current schedule to a different schedule. Group must have availability for the target slot.
        </Text>

        {!isModerator && (
          <Alert type="warning" showIcon
            message="Only Moderators can reassign groups."
            style={{ marginBottom: 12 }} />
        )}

        <Form form={reassignGroupForm} layout="vertical" onFinish={handleReassignGroup}
          style={{ maxWidth: 720 }}>
          <Form.Item
            name="reviewScheduleId" label="Source Schedule ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Current Review Schedule ID (UUID)" />
          </Form.Item>
          <Form.Item
            name="groupId" label="Group ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Project Group ID (UUID)" />
          </Form.Item>
          <Form.Item
            name="newScheduleId" label="Target Schedule ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="New Review Schedule ID (UUID)" />
          </Form.Item>
          <Button
            type="primary" htmlType="submit"
            icon={<SwapOutlined />} loading={reassigningGroup}
            disabled={!isModerator}
            style={{ background: FAP_COLORS.primary }}
          >
            Reassign Group
          </Button>
        </Form>
      </div>

      {/* FR-07: Reassign Lecturer */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
          <TeamOutlined /> Reassign Lecturer (Manual Adjustment)
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Move a lecturer from its current schedule to a different schedule. Lecturer must have availability and must not supervise groups on the target schedule.
        </Text>

        {!isModerator && (
          <Alert type="warning" showIcon
            message="Only Moderators can reassign lecturers."
            style={{ marginBottom: 12 }} />
        )}

        <Form form={reassignLecturerForm} layout="vertical" onFinish={handleReassignLecturer}
          style={{ maxWidth: 720 }}>
          <Form.Item
            name="reviewScheduleId" label="Source Schedule ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Current Review Schedule ID (UUID)" />
          </Form.Item>
          <Form.Item
            name="lecturerId" label="Lecturer ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Lecturer ID (UUID)" />
          </Form.Item>
          <Form.Item
            name="newScheduleId" label="Target Schedule ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="New Review Schedule ID (UUID)" />
          </Form.Item>
          <Button
            type="primary" htmlType="submit"
            icon={<TeamOutlined />} loading={reassigningLecturer}
            disabled={!isModerator}
            style={{ background: FAP_COLORS.primary }}
          >
            Reassign Lecturer
          </Button>
        </Form>
      </div>

      {/* Rooms section */}
      <div className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: FAP_COLORS.primary }}>
            <HomeOutlined /> Available Rooms
          </Title>
        </div>
        <Row gutter={12}>
          {rooms.map(room => (
            <Col span={4} key={room.id}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: 6 }}>
                <HomeOutlined style={{ fontSize: 20, color: FAP_COLORS.primary }} />
                <div style={{ fontWeight: 600, marginTop: 4 }}>{room.name}</div>
                {room.capacity && (
                  <Tag color="blue" style={{ fontSize: 10 }}>Cap: {room.capacity}</Tag>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </MainLayout>
  )
}
