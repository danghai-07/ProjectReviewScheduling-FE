'use client'
import { useState, useEffect } from 'react'
import {
  Table, Button, Select, Space, Tag, Typography,
  message, Card, Row, Col, Modal, Form, InputNumber, Divider
} from 'antd'
import { TeamOutlined, PlusOutlined, MailOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, lecturersApi } from '@/lib/services'
import { FAP_COLORS, STATUS_COLORS } from '@/lib/constants'
import type { ReviewRoundDto } from '@/types'

const { Text, Title } = Typography
const { Option } = Select

// Demo lecturer data (normally from a /api/lecturers endpoint — add when ready)
const DEMO_LECTURERS = [
  { id: '', fullName: 'Tran Thi Bich', email: 'lecturer1@university.edu', department: 'Software Engineering' },
  { id: '', fullName: 'Le Van Cuong', email: 'lecturer2@university.edu', department: 'Computer Science' },
  { id: '', fullName: 'Pham Minh Duc', email: 'lecturer3@university.edu', department: 'Information Systems' },
  { id: '', fullName: 'Hoang Thi Lan', email: 'lecturer4@university.edu', department: 'Data Science' },
  { id: '', fullName: 'Nguyen Quoc Hung', email: 'lecturer5@university.edu', department: 'Cybersecurity' },
]

export default function LecturersPage() {
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [compatOpen, setCompatOpen] = useState(false)
  const [compatForm] = Form.useForm()

  useEffect(() => {
    roundsApi.getAll().then(r => setRounds(r.data.data || []))
  }, [])

  const handleInvite = async (email: string) => {
    if (!selectedRoundId) return message.warning('Please select a round first')
    message.info(`Invitation sent to ${email} (wire to real lecturer ID from /api/lecturers when endpoint is ready)`)
  }

  const handleSetCompatibility = async (values: any) => {
    try {
      await lecturersApi.setCompatibility(
        values.reviewRoundId, values.lecturerAId, values.lecturerBId, values.score
      )
      message.success('Compatibility score saved!')
      setCompatOpen(false)
      compatForm.resetFields()
    } catch { message.error('Failed to save compatibility score') }
  }

  const columns = [
    { title: '#', key: 'i', width: 40,
      render: (_: any, __: any, i: number) => <Text type="secondary">{i + 1}</Text> },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName',
      render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Email', dataIndex: 'email', key: 'email',
      render: (v: string) => <Text style={{ fontSize: 12 }}><MailOutlined /> {v}</Text> },
    { title: 'Department', dataIndex: 'department', key: 'department',
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (row: any) => (
        <Button size="small" type="primary"
          style={{ background: FAP_COLORS.primary, fontSize: 11 }}
          onClick={() => handleInvite(row.email)}>
          Invite
        </Button>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><TeamOutlined /> Lecturers</h2>
        <Space>
          <Select
            placeholder="Select round to invite..." style={{ width: 220 }}
            value={selectedRoundId || undefined}
            onChange={setSelectedRoundId} size="small"
          >
            {rounds.map(r => (
              <Option key={r.id} value={r.id}>{r.name} — {r.semester}</Option>
            ))}
          </Select>
          <Button size="small" icon={<PlusOutlined />}
            onClick={() => setCompatOpen(true)}>
            Set Compatibility Score
          </Button>
        </Space>
      </div>

      <div className="page-card">
        {selectedRoundId && (
          <Tag color="blue" style={{ marginBottom: 12 }}>
            Inviting to: {rounds.find(r => r.id === selectedRoundId)?.name}
          </Tag>
        )}
        <Table
          dataSource={DEMO_LECTURERS} columns={columns}
          rowKey="email" size="small"
          pagination={false}
        />
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
          <Form.Item name="lecturerAId" label="Lecturer A ID" rules={[{ required: true }]}>
            <Select placeholder="Lecturer A UUID">
              {DEMO_LECTURERS.map(l => <Option key={l.email} value={l.email}>{l.fullName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="lecturerBId" label="Lecturer B ID" rules={[{ required: true }]}>
            <Select placeholder="Lecturer B UUID">
              {DEMO_LECTURERS.map(l => <Option key={l.email} value={l.email}>{l.fullName}</Option>)}
            </Select>
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
