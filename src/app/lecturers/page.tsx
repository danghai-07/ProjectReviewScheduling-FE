'use client'
import { useState, useEffect } from 'react'
import {
  Button, Select, Space, Tag, Typography, message, Alert,
  Modal, Form, InputNumber, Input, Popconfirm
} from 'antd'
import {
  TeamOutlined, PlusOutlined, MailOutlined,
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, lecturersApi } from '@/lib/services'
import { FAP_COLORS, UUID_PATTERN } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRoundDto } from '@/types'

const { Text, Title } = Typography
const { Option } = Select

export default function LecturersPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [compatOpen, setCompatOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [inviteForm] = Form.useForm()
  const [respondForm] = Form.useForm()
  const [compatForm] = Form.useForm()

  const isModerator = user?.role === 'Moderator'
  const isLecturer = user?.role === 'Lecturer'

  useEffect(() => {
    roundsApi.getAll().then(r => setRounds(r.data.data || []))
  }, [])

  // FR-03: Invite lecturer to a review round
  const handleInvite = async (values: { reviewRoundId: string; lecturerId: string }) => {
    setInviting(true)
    try {
      const res = await lecturersApi.invite(
        values.reviewRoundId,
        values.lecturerId.trim()
      )
      if (res.data.success) {
        message.success('Invitation sent!')
        inviteForm.resetFields(['lecturerId'])
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  // FR-03: Lecturer accept / decline invitation
  const handleRespond = async (accept: boolean) => {
    try {
      await respondForm.validateFields()
    } catch { return }
    const invitationId = respondForm.getFieldValue('invitationId').trim()
    setResponding(true)
    try {
      const res = await lecturersApi.respondInvitation(invitationId, accept)
      if (res.data.success) {
        message.success(accept ? 'Invitation accepted!' : 'Invitation declined.')
        respondForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to respond to invitation')
    } finally {
      setResponding(false)
    }
  }

  const handleSetCompatibility = async (values: any) => {
    try {
      const res = await lecturersApi.setCompatibility(
        values.reviewRoundId,
        values.lecturerAId.trim(),
        values.lecturerBId.trim(),
        values.score
      )
      if (res.data.success) {
        message.success('Compatibility score saved!')
        setCompatOpen(false)
        compatForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to save compatibility score')
    }
  }

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><TeamOutlined /> Lecturers</h2>
        <Space>
          <Tag color="blue">{user?.role} — {user?.fullName}</Tag>
          <Button size="small" icon={<PlusOutlined />}
            disabled={!isModerator}
            onClick={() => setCompatOpen(true)}>
            Set Compatibility Score
          </Button>
        </Space>
      </div>

      {/* FR-03: Invite Lecturer */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
          <MailOutlined /> Invite Lecturer to Round
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Enter the Lecturer entity ID (from database / Swagger). No GET /api/lecturers endpoint yet.
        </Text>

        {!isModerator && (
          <Alert type="warning" showIcon
            message="Only Moderators can invite lecturers."
            style={{ marginBottom: 12 }} />
        )}

        <Form form={inviteForm} layout="inline" onFinish={handleInvite}>
          <Form.Item
            name="reviewRoundId"
            rules={[{ required: true, message: 'Select a round' }]}
          >
            <Select placeholder="Select review round..." style={{ width: 240 }}>
              {rounds.map(r => (
                <Option key={r.id} value={r.id}>
                  {r.name} — {r.semester}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="lecturerId"
            rules={[
              { required: true, message: 'Lecturer ID is required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
            style={{ flex: 1, minWidth: 320 }}
          >
            <Input placeholder="Lecturer ID (UUID)" />
          </Form.Item>
          <Button
            type="primary" htmlType="submit"
            icon={<MailOutlined />} loading={inviting}
            disabled={!isModerator}
            style={{ background: FAP_COLORS.primary }}
          >
            Send Invitation
          </Button>
        </Form>
      </div>

      {/* FR-03: Respond to Invitation */}
      <div className="page-card">
        <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
          <CheckOutlined /> Respond to Invitation
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Enter the Invitation ID from the database. No GET invitations endpoint yet.
        </Text>

        {!isLecturer && (
          <Alert type="warning" showIcon
            message="Only Lecturers can accept or decline invitations."
            style={{ marginBottom: 12 }} />
        )}

        <Form form={respondForm} layout="inline">
          <Form.Item
            name="invitationId"
            rules={[
              { required: true, message: 'Invitation ID is required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
            style={{ flex: 1, minWidth: 320 }}
          >
            <Input placeholder="Invitation ID (UUID)" />
          </Form.Item>
          <Space>
            <Popconfirm
              title="Accept invitation?"
              onConfirm={() => handleRespond(true)}
              okButtonProps={{ style: { background: FAP_COLORS.primary } }}
            >
              <Button
                icon={<CheckOutlined />} loading={responding}
                disabled={!isLecturer}
                style={{ borderColor: FAP_COLORS.success, color: FAP_COLORS.success }}
              >
                Accept
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Decline invitation?"
              onConfirm={() => handleRespond(false)}
              okButtonProps={{ danger: true }}
            >
              <Button
                danger icon={<CloseOutlined />} loading={responding}
                disabled={!isLecturer}
              >
                Decline
              </Button>
            </Popconfirm>
          </Space>
        </Form>
      </div>

      {/* Compatibility Score Modal */}
      <Modal title="Set Lecturer Compatibility Score (SO-01)"
        open={compatOpen}
        onCancel={() => { setCompatOpen(false); compatForm.resetFields() }}
        onOk={() => compatForm.submit()}
        okButtonProps={{ style: { background: FAP_COLORS.primary } }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
          Higher scores = system prefers pairing these lecturers together during auto-scheduling.
        </Text>
        <Form form={compatForm} onFinish={handleSetCompatibility} layout="vertical" size="small">
          <Form.Item name="reviewRoundId" label="Review Round" rules={[{ required: true }]}>
            <Select placeholder="Select round">
              {rounds.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item
            name="lecturerAId" label="Lecturer A ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Lecturer A UUID" />
          </Form.Item>
          <Form.Item
            name="lecturerBId" label="Lecturer B ID"
            rules={[
              { required: true, message: 'Required' },
              { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
            ]}
          >
            <Input placeholder="Lecturer B UUID" />
          </Form.Item>
          <Form.Item name="score" label="Compatibility Score (0–10)"
            initialValue={5} rules={[{ required: true }]}>
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  )
}
