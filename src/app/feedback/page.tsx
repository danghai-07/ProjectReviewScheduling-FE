'use client'
import { useState, useEffect } from 'react'
import {
  Form, Input, Select, Button, Card, Typography,
  message, Alert, Space, Tag, Divider, Row, Col
} from 'antd'
import { CommentOutlined, SendOutlined, StarOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi } from '@/lib/services'
import api from '@/lib/api'
import { FAP_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRoundDto } from '@/types'

const { Title, Text, TextArea } = Typography
const { Option } = Select

export default function FeedbackPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    roundsApi.getAll().then(r =>
      setRounds((r.data.data || []).filter(
        (rd: ReviewRoundDto) => rd.status === 'Published' || rd.status === 'Completed'
      ))
    )
  }, [])

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      await api.post('/api/feedback', {
        reviewScheduleId: values.reviewScheduleId,
        groupId: values.groupId,
        lecturerId: user?.userId,
        comments: values.comments,
        recommendations: values.recommendations,
        evaluationNotes: values.evaluationNotes,
      })
      message.success('Feedback submitted successfully!')
      setSubmitted(true)
      form.resetFields()
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><CommentOutlined /> Review Feedback</h2>
        <Tag color="blue">{user?.role} — {user?.fullName}</Tag>
      </div>

      {user?.role !== 'Lecturer' && (
        <Alert type="warning" showIcon
          message="Only Lecturers can submit review feedback."
          style={{ marginBottom: 16 }} />
      )}

      <Row gutter={16}>
        <Col span={14}>
          <div className="page-card">
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 16 }}>
              <StarOutlined /> Submit Review Feedback
            </Title>

            {submitted && (
              <Alert type="success" showIcon
                message="Feedback submitted! You can submit more feedback below."
                style={{ marginBottom: 16 }}
                action={<Button size="small" onClick={() => setSubmitted(false)}>New</Button>}
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit} size="middle">
              <Form.Item name="reviewScheduleId" label="Review Schedule ID"
                rules={[{ required: true, message: 'Required' }]}
                help="Enter the UUID of the review schedule">
                <Input placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6" />
              </Form.Item>

              <Form.Item name="groupId" label="Student Group ID"
                rules={[{ required: true, message: 'Required' }]}
                help="Enter the UUID of the student group being reviewed">
                <Input placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa7" />
              </Form.Item>

              <Divider style={{ margin: '8px 0 16px' }} />

              <Form.Item name="comments" label="Comments"
                rules={[{ required: true, message: 'Please enter your comments' }]}>
                <Input.TextArea
                  rows={3}
                  placeholder="Overall comments about the group's presentation and project progress..."
                />
              </Form.Item>

              <Form.Item name="recommendations" label="Recommendations"
                rules={[{ required: true, message: 'Please enter recommendations' }]}>
                <Input.TextArea
                  rows={3}
                  placeholder="What should the group improve or focus on before the next review..."
                />
              </Form.Item>

              <Form.Item name="evaluationNotes" label="Evaluation Notes">
                <Input.TextArea
                  rows={2}
                  placeholder="Internal notes for grading purposes (optional)..."
                />
              </Form.Item>

              <Button
                type="primary" htmlType="submit"
                loading={submitting}
                disabled={user?.role !== 'Lecturer'}
                icon={<SendOutlined />}
                style={{ background: FAP_COLORS.primary }}
              >
                Submit Feedback
              </Button>
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
        </Col>
      </Row>
    </MainLayout>
  )
}
