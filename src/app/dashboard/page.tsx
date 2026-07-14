'use client'
import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Tag, Table, Typography, Spin, Badge } from 'antd'
import {
  CalendarOutlined, TeamOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ScheduleOutlined, ApiOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi } from '@/lib/services'
import { useAuthStore } from '@/stores/authStore'
import { STATUS_COLORS, FAP_COLORS } from '@/lib/constants'
import type { ReviewRoundDto } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roundsApi.getAll().then(r => {
      setRounds(r.data.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = {
    total: rounds.length,
    open: rounds.filter(r => r.status === 'RegistrationOpen').length,
    scheduling: rounds.filter(r => r.status === 'Scheduling').length,
    published: rounds.filter(r => r.status === 'Published').length,
    completed: rounds.filter(r => r.status === 'Completed').length,
  }

  const recentRounds = [...rounds].slice(0, 5)

  const columns = [
    { title: 'Round Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong style={{ color: FAP_COLORS.primary }}>{v}</Text> },
    { title: 'Semester', dataIndex: 'semester', key: 'semester' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
    { title: 'Slots', dataIndex: 'totalSlots', key: 'totalSlots',
      render: (v: number) => <Badge count={v} showZero color="#003087" /> },
    { title: 'Reg. End', dataIndex: 'registrationEndDate', key: 'registrationEndDate',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
  ]

  return (
    <MainLayout>
      {/* Page title bar */}
      <div className="page-title-bar">
        <h2>📋 Dashboard</h2>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Welcome back, <strong>{user?.fullName}</strong> [{user?.role}]
        </Text>
      </div>

      <Spin spinning={loading}>
        {/* Stats row */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          {[
            { title: 'Total Rounds', value: stats.total, icon: <CalendarOutlined />, color: '#003087' },
            { title: 'Registration Open', value: stats.open, icon: <ClockCircleOutlined />, color: '#1677ff' },
            { title: 'Scheduling', value: stats.scheduling, icon: <ScheduleOutlined />, color: '#fa8c16' },
            { title: 'Published', value: stats.published, icon: <CheckCircleOutlined />, color: '#52c41a' },
            { title: 'Completed', value: stats.completed, icon: <TeamOutlined />, color: '#722ed1' },
          ].map(s => (
            <Col span={4} key={s.title}>
              <Card size="small" style={{ borderTop: `3px solid ${s.color}`, borderRadius: 6 }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: '#666' }}>{s.title}</span>}
                  value={s.value}
                  prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                  valueStyle={{ fontSize: 22, fontWeight: 700, color: s.color }}
                />
              </Card>
            </Col>
          ))}
          <Col span={4}>
            <Card size="small" style={{ borderTop: `3px solid #E87722`, borderRadius: 6, background: '#fff8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ApiOutlined style={{ color: '#E87722', fontSize: 20 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#666' }}>gRPC Service</div>
                  <Tag color="green" style={{ marginTop: 2 }}>Active</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent rounds table */}
        <div className="page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, color: FAP_COLORS.primary }}>
              Recent Review Rounds
            </Title>
          </div>
          <Table
            dataSource={recentRounds}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </div>

        {/* System info */}
        <div className="page-card">
          <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
            System Components
          </Title>
          <Row gutter={12}>
            {[
              { name: 'REST API', desc: 'ASP.NET Core 8', port: ':8080', color: '#003087' },
              { name: 'Redis Pub/Sub', desc: 'Message Broker', port: ':6379', color: '#cc0000' },
              { name: 'gRPC Service', desc: 'Report Service', port: ':5200', color: '#E87722' },
              { name: 'Background Job', desc: 'Schedule Reminder', port: 'Hourly', color: '#52c41a' },
            ].map(c => (
              <Col span={6} key={c.name}>
                <Card size="small" style={{ borderRadius: 6, borderLeft: `4px solid ${c.color}` }}>
                  <Text strong style={{ color: c.color, fontSize: 13 }}>{c.name}</Text>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{c.desc}</div>
                  <Tag color="default" style={{ marginTop: 6, fontSize: 10 }}>{c.port}</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Spin>
    </MainLayout>
  )
}
