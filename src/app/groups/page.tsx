'use client'
import { useState, useEffect } from 'react'
import { Table, Select, Button, Tag, Typography, message, Space, Alert } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import type { ReviewRoundDto } from '@/types'

const { Text } = Typography
const { Option } = Select

const DEMO_GROUPS = [
  { id: '1', name: 'Group 01', projectTitle: 'Smart Campus Management System', semester: 'HK1_2025', memberCount: 2 },
  { id: '2', name: 'Group 02', projectTitle: 'AI-based Exam Proctoring', semester: 'HK1_2025', memberCount: 2 },
  { id: '3', name: 'Group 03', projectTitle: 'E-Learning Recommendation Engine', semester: 'HK1_2025', memberCount: 2 },
  { id: '4', name: 'Group 04', projectTitle: 'Hospital Appointment Booking', semester: 'HK1_2025', memberCount: 2 },
  { id: '5', name: 'Group 05', projectTitle: 'Food Delivery Tracking App', semester: 'HK1_2025', memberCount: 2 },
]

export default function GroupsPage() {
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])

  useEffect(() => { roundsApi.getAll().then(r => setRounds(r.data.data || [])) }, [])

  const columns = [
    { title: '#', key: 'i', width: 40,
      render: (_: any, __: any, i: number) => <Text type="secondary">{i + 1}</Text> },
    { title: 'Group', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong style={{ color: FAP_COLORS.primary }}>{v}</Text> },
    { title: 'Project Title', dataIndex: 'projectTitle', key: 'projectTitle' },
    { title: 'Semester', dataIndex: 'semester', key: 'semester',
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Members', dataIndex: 'memberCount', key: 'memberCount',
      render: (v: number) => <Tag color="green">{v} members</Tag> },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><BookOutlined /> Student Groups</h2>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Group availability registration is done by Group Leaders via POST /api/groups/availability" />

      <div className="page-card">
        <Table dataSource={DEMO_GROUPS} columns={columns}
          rowKey="id" size="small" pagination={false} />
      </div>
    </MainLayout>
  )
}
