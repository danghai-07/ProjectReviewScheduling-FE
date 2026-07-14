'use client'
import { useEffect, useState } from 'react'
import {
  Select, Button, Card, Checkbox, Table, Tag, Typography,
  message, Spin, Alert, Space, Row, Col, Divider, Steps
} from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, lecturersApi, groupsApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRoundDto, ReviewSlotDto } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function AvailabilityPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [slots, setSlots] = useState<ReviewSlotDto[]>([])
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isLecturer = user?.role === 'Lecturer'
  const isStudent = user?.role === 'Student'

  useEffect(() => {
    roundsApi.getAll().then(r => {
      const open = (r.data.data || []).filter(
        (rd: ReviewRoundDto) => rd.status === 'RegistrationOpen'
      )
      setRounds(open)
    })
  }, [])

  const handleRoundChange = async (roundId: string) => {
    setSelectedRoundId(roundId)
    setSelectedSlotIds([])
    setSubmitted(false)
    setLoadingSlots(true)
    try {
      const res = await roundsApi.getSlots(roundId)
      setSlots(res.data.data || [])
    } catch { message.error('Failed to load slots') }
    finally { setLoadingSlots(false) }
  }

  const handleSubmit = async () => {
    if (!selectedRoundId) return message.warning('Please select a review round')
    if (selectedSlotIds.length === 0) return message.warning('Please select at least one slot')
    if (!user) return message.error('Not authenticated')

    setSubmitting(true)
    try {
      if (isLecturer) {
        await lecturersApi.registerAvailability(user.userId, selectedRoundId, selectedSlotIds)
        message.success(`Availability registered for ${selectedSlotIds.length} slot(s)!`)
      } else if (isStudent) {
        // groupId would come from user profile — using userId as placeholder
        await groupsApi.registerAvailability(user.userId, selectedRoundId, selectedSlotIds)
        message.success(`Group availability registered for ${selectedSlotIds.length} slot(s)!`)
      }
      setSubmitted(true)
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to register availability')
    } finally {
      setSubmitting(false)
    }
  }

  // Group slots by date for better display
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = dayjs(slot.date).format('YYYY-MM-DD')
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, ReviewSlotDto[]>)

  const columns = [
    {
      title: '',
      key: 'check',
      width: 40,
      render: (slot: ReviewSlotDto) => (
        <Checkbox
          checked={selectedSlotIds.includes(slot.id)}
          onChange={e => {
            if (e.target.checked) setSelectedSlotIds(prev => [...prev, slot.id])
            else setSelectedSlotIds(prev => prev.filter(id => id !== slot.id))
          }}
        />
      ),
    },
    {
      title: 'Time',
      key: 'time',
      render: (slot: ReviewSlotDto) => (
        <Space>
          <ClockCircleOutlined style={{ color: FAP_COLORS.primary }} />
          <Text strong>
            {slot.startTime?.substring(0, 5)} – {slot.endTime?.substring(0, 5)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (slot: ReviewSlotDto) => (
        selectedSlotIds.includes(slot.id)
          ? <Tag color="green" icon={<CheckCircleOutlined />}>Selected</Tag>
          : <Tag color="default">Available</Tag>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><CalendarOutlined /> Register Availability</h2>
        <Tag color={isLecturer ? 'blue' : 'green'} style={{ fontSize: 12 }}>
          {user?.role} — {user?.fullName}
        </Tag>
      </div>

      {/* Steps guide */}
      <div className="page-card">
        <Steps
          size="small"
          current={!selectedRoundId ? 0 : submitted ? 2 : 1}
          items={[
            { title: 'Select Round', description: 'Pick an open round' },
            { title: 'Pick Slots', description: 'Choose your available times' },
            { title: 'Submit', description: 'Confirm registration' },
          ]}
        />
      </div>

      {/* Round selector */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
          1. Select Review Round
        </Title>
        {rounds.length === 0 ? (
          <Alert type="warning" showIcon
            message="No rounds are currently open for registration." />
        ) : (
          <Select
            style={{ width: 320 }}
            placeholder="Select a review round..."
            value={selectedRoundId || undefined}
            onChange={handleRoundChange}
          >
            {rounds.map(r => (
              <Option key={r.id} value={r.id}>
                <Space>
                  <span>{r.name}</span>
                  <Tag color="blue">{r.semester}</Tag>
                  <Tag color="green">Registration Open</Tag>
                </Space>
              </Option>
            ))}
          </Select>
        )}
      </div>

      {/* Slot picker */}
      {selectedRoundId && (
        <div className="page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={5} style={{ color: FAP_COLORS.primary, margin: 0 }}>
              2. Select Available Slots
            </Title>
            <Space>
              <Button size="small" onClick={() => setSelectedSlotIds(slots.map(s => s.id))}>
                Select All
              </Button>
              <Button size="small" onClick={() => setSelectedSlotIds([])}>
                Clear
              </Button>
              <Tag color="blue">{selectedSlotIds.length} selected</Tag>
            </Space>
          </div>

          <Spin spinning={loadingSlots}>
            {slots.length === 0 ? (
              <Alert type="info" showIcon message="No slots created for this round yet." />
            ) : (
              <Row gutter={16}>
                {Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <Col span={8} key={date}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <CalendarOutlined style={{ color: FAP_COLORS.primary }} />
                          <Text strong style={{ color: FAP_COLORS.primary }}>
                            {dayjs(date).format('ddd, DD/MM/YYYY')}
                          </Text>
                        </Space>
                      }
                      style={{ marginBottom: 12, borderTop: `3px solid ${FAP_COLORS.primary}` }}
                    >
                      <Table
                        dataSource={daySlots}
                        columns={columns}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        showHeader={false}
                        rowClassName={slot =>
                          selectedSlotIds.includes(slot.id) ? 'ant-table-row-selected' : ''
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </div>
      )}

      {/* Submit */}
      {selectedRoundId && slots.length > 0 && !submitted && (
        <div className="page-card">
          <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
            3. Confirm Registration
          </Title>
          <Alert
            type="info" showIcon
            style={{ marginBottom: 12 }}
            message={`You have selected ${selectedSlotIds.length} slot(s). Click Submit to register.`}
          />
          <Button
            type="primary" size="large"
            loading={submitting}
            disabled={selectedSlotIds.length === 0}
            onClick={handleSubmit}
            style={{ background: FAP_COLORS.primary }}
            icon={<CheckCircleOutlined />}
          >
            Submit Availability ({selectedSlotIds.length} slots)
          </Button>
        </div>
      )}

      {/* Success */}
      {submitted && (
        <div className="page-card">
          <Alert
            type="success" showIcon
            message="Availability Registered Successfully!"
            description={`You have registered ${selectedSlotIds.length} slot(s) for this review round. The system will use this information during auto-scheduling.`}
          />
        </div>
      )}
    </MainLayout>
  )
}
