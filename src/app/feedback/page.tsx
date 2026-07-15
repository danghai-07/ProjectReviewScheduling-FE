'use client'
import { useState, useEffect } from 'react'
import {
  Form, Input, Button, Card, Typography,
  message, Alert, Space, Tag, Divider, Row, Col, Popconfirm, Empty
} from 'antd'
import {
  CommentOutlined, SendOutlined, StarOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, schedulesApi, feedbackApi } from '@/lib/services'
import { FAP_COLORS, UUID_PATTERN } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRoundDto } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface SubmittedFeedback {
  reviewScheduleId: string
  groupId: string
  submittedAt: string
}

export default function FeedbackPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [form] = Form.useForm()
  const [completeForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [history, setHistory] = useState<SubmittedFeedback[]>([])

  const isLecturer = user?.role === 'Lecturer'

  useEffect(() => {
    roundsApi.getAll().then(r =>
      setRounds((r.data.data || []).filter(
        (rd: ReviewRoundDto) => rd.status === 'Published' || rd.status === 'Completed'
      ))
    )
  }, [])

  // FR-11: Submit review feedback
  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const res = await feedbackApi.submit({
        reviewScheduleId: values.reviewScheduleId.trim(),
        groupId: values.groupId.trim(),
        lecturerId: values.lecturerId.trim(),
        comments: values.comments,
        recommendations: values.recommendations,
        evaluationNotes: values.evaluationNotes || '',
      })
      if (res.data.success) {
        message.success('Feedback submitted successfully!')
        setHistory(prev => [{
          reviewScheduleId: values.reviewScheduleId.trim(),
          groupId: values.groupId.trim(),
          submittedAt: dayjs().format('HH:mm:ss'),
        }, ...prev])
        // Pre-fill the complete form so the lecturer can mark this review done
        completeForm.setFieldsValue({ reviewScheduleId: values.reviewScheduleId.trim() })
        form.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  // FR-12: Mark review as completed
  const handleComplete = async () => {
    try {
      await completeForm.validateFields()
    } catch { return }
    const reviewScheduleId = completeForm.getFieldValue('reviewScheduleId').trim()
    setCompleting(true)
    try {
      const res = await schedulesApi.complete(reviewScheduleId)
      if (res.data.success) {
        message.success('Review marked as completed!')
        completeForm.resetFields()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to mark review as completed')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><CommentOutlined /> Review Feedback</h2>
        <Tag color="blue">{user?.role} — {user?.fullName}</Tag>
      </div>

      {!isLecturer && (
        <Alert type="warning" showIcon
          message="Only Lecturers can submit review feedback and mark reviews as completed."
          style={{ marginBottom: 16 }} />
      )}

      <Row gutter={16}>
        <Col span={14}>
          {/* FR-11: Feedback form */}
          <div className="page-card">
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 16 }}>
              <StarOutlined /> Submit Review Feedback
            </Title>

            <Form form={form} layout="vertical" onFinish={handleSubmit} size="middle">
              <Form.Item name="lecturerId" label="Your Lecturer ID"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
                ]}
                help="Your Lecturer record ID — this is not the same as your login account ID">
                <Input placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa5" />
              </Form.Item>

              <Form.Item name="reviewScheduleId" label="Review Schedule ID"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
                ]}
                help="Enter the UUID of the review schedule">
                <Input placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6" />
              </Form.Item>

              <Form.Item name="groupId" label="Student Group ID"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
                ]}
                help="Enter the UUID of the student group being reviewed">
                <Input placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa7" />
              </Form.Item>

              <Divider style={{ margin: '8px 0 16px' }} />

              <Form.Item name="comments" label="Comments"
                rules={[{ required: true, message: 'Please enter your comments' }]}>
                <Input.TextArea
                  rows={3} showCount maxLength={2000}
                  placeholder="Overall comments about the group's presentation and project progress..."
                />
              </Form.Item>

              <Form.Item name="recommendations" label="Recommendations"
                rules={[{ required: true, message: 'Please enter recommendations' }]}>
                <Input.TextArea
                  rows={3} showCount maxLength={2000}
                  placeholder="What should the group improve or focus on before the next review..."
                />
              </Form.Item>

              <Form.Item name="evaluationNotes" label="Evaluation Notes (optional)">
                <Input.TextArea
                  rows={2} showCount maxLength={2000}
                  placeholder="Internal notes for grading purposes..."
                />
              </Form.Item>

              <Button
                type="primary" htmlType="submit"
                loading={submitting}
                disabled={!isLecturer}
                icon={<SendOutlined />}
                style={{ background: FAP_COLORS.primary }}
              >
                Submit Feedback
              </Button>
            </Form>
          </div>

          {/* FR-12: Mark review completed */}
          <div className="page-card">
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 4 }}>
              <CheckCircleOutlined /> Mark Review Completed
            </Title>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              Once all groups in a review session have been reviewed, mark the schedule as completed.
              The ID is pre-filled after you submit feedback.
            </Text>
            <Form form={completeForm} layout="inline">
              <Form.Item
                name="reviewScheduleId"
                rules={[
                  { required: true, message: 'Schedule ID is required' },
                  { pattern: UUID_PATTERN, message: 'Must be a valid UUID' },
                ]}
                style={{ flex: 1, minWidth: 320 }}
              >
                <Input placeholder="Review Schedule ID (UUID)" />
              </Form.Item>
              <Popconfirm
                title="Mark Review Completed"
                description="This marks the review session as completed. Continue?"
                onConfirm={handleComplete}
                okButtonProps={{ style: { background: FAP_COLORS.primary } }}
              >
                <Button
                  icon={<CheckCircleOutlined />}
                  loading={completing}
                  disabled={!isLecturer}
                  style={{ borderColor: FAP_COLORS.success, color: FAP_COLORS.success }}
                >
                  Mark Completed
                </Button>
              </Popconfirm>
            </Form>
          </div>
        </Col>

        <Col span={10}>
          <div className="page-card">
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
              📋 Guidelines
            </Title>
            {[
              { title: 'Comments', desc: 'Assess the overall quality of the presentation, demo, and project documentation.' },
              { title: 'Recommendations', desc: 'Specific, actionable improvements the group should make before the next review.' },
              { title: 'Evaluation Notes', desc: 'Internal notes used for final grading — not visible to students.' },
              { title: 'Mark Completed', desc: 'After submitting feedback for all groups in the session, mark the review schedule as completed.' },
            ].map(g => (
              <Card key={g.title} size="small" style={{ marginBottom: 8, borderLeft: `3px solid ${FAP_COLORS.primary}` }}>
                <Text strong style={{ color: FAP_COLORS.primary }}>{g.title}</Text>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{g.desc}</div>
              </Card>
            ))}

            <Divider />

            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 8 }}>
              Published Rounds
            </Title>
            {rounds.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>No published rounds yet.</Text>
            ) : rounds.map(r => (
              <div key={r.id} style={{ marginBottom: 6 }}>
                <Tag color="green">{r.name}</Tag>
                <Text style={{ fontSize: 11, color: '#999' }}> {r.semester}</Text>
              </div>
            ))}
          </div>

          {/* Feedback submitted in this session */}
          <div className="page-card">
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
              <ClockCircleOutlined /> Submitted This Session
            </Title>
            {history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary" style={{ fontSize: 12 }}>No feedback submitted yet</Text>} />
            ) : history.map((h, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8, borderLeft: `3px solid ${FAP_COLORS.success}` }}>
                <Space direction="vertical" size={2}>
                  <Text style={{ fontSize: 11 }}>
                    <Text type="secondary">Schedule:</Text>{' '}
                    <Text code style={{ fontSize: 11 }}>{h.reviewScheduleId}</Text>
                  </Text>
                  <Text style={{ fontSize: 11 }}>
                    <Text type="secondary">Group:</Text>{' '}
                    <Text code style={{ fontSize: 11 }}>{h.groupId}</Text>
                  </Text>
                  <Tag color="green" style={{ fontSize: 10 }}>
                    <CheckCircleOutlined /> Submitted at {h.submittedAt}
                  </Tag>
                </Space>
              </Card>
            ))}
          </div>
        </Col>
      </Row>
    </MainLayout>
  )
}
