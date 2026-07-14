'use client'
import { useEffect, useState } from 'react'
import {
  Select, Button, Card, Row, Col, Statistic, Table, Progress,
  Typography, message, Spin, Tabs, Tag, Alert, Space
} from 'antd'
import {
  BarChartOutlined, ApiOutlined, ReloadOutlined,
  CheckCircleOutlined, TeamOutlined, CalendarOutlined
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, reportsApi, grpcReportsApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import type { ReviewRoundDto, ReviewReportDto, GrpcRoundReportDto } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

export default function ReportsPage() {
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [report, setReport] = useState<ReviewReportDto | null>(null)
  const [grpcReport, setGrpcReport] = useState<GrpcRoundReportDto | null>(null)
  const [workload, setWorkload] = useState<any[]>([])
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [grpcLoading, setGrpcLoading] = useState(false)

  useEffect(() => {
    roundsApi.getAll().then(r => setRounds(r.data.data || []))
  }, [])

  const handleLoadReport = async () => {
    if (!selectedRoundId) return message.warning('Please select a round')
    setLoading(true)
    try {
      const res = await reportsApi.getReport(selectedRoundId)
      if (res.data.success) setReport(res.data.data)
      else message.error(res.data.message)
    } catch { message.error('Failed to load report') }
    finally { setLoading(false) }
  }

  const handleLoadGrpc = async () => {
    if (!selectedRoundId) return message.warning('Please select a round')
    setGrpcLoading(true)
    try {
      const [rpt, wl, st] = await Promise.all([
        grpcReportsApi.getRoundReport(selectedRoundId),
        grpcReportsApi.getWorkload(selectedRoundId),
        grpcReportsApi.getStatus(selectedRoundId),
      ])
      setGrpcReport(rpt.data.data)
      setWorkload(wl.data.data || [])
      setStatus(st.data.data)
      message.success('gRPC data loaded!')
    } catch { message.error('gRPC service unavailable') }
    finally { setGrpcLoading(false) }
  }

  const workloadColumns = [
    { title: 'Lecturer', dataIndex: 'lecturerName', key: 'lecturerName',
      render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Department', dataIndex: 'department', key: 'department',
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Reviews', dataIndex: 'assignedReviews', key: 'assignedReviews',
      render: (v: number) => (
        <Space>
          <Progress percent={Math.min(v * 20, 100)} steps={5}
            strokeColor={FAP_COLORS.primary} size="small" />
          <Text strong>{v}</Text>
        </Space>
      ),
    },
  ]

  const statCard = (title: string, value: any, color: string, suffix?: string) => (
    <Card size="small" style={{ borderTop: `3px solid ${color}`, borderRadius: 6 }}>
      <Statistic title={<span style={{ fontSize: 11 }}>{title}</span>}
        value={value} suffix={suffix}
        valueStyle={{ fontSize: 20, fontWeight: 700, color }} />
    </Card>
  )

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><BarChartOutlined /> Reports & Analytics</h2>
      </div>

      {/* Round selector */}
      <div className="page-card">
        <Space>
          <Select placeholder="Select review round..." style={{ width: 260 }}
            value={selectedRoundId || undefined} onChange={setSelectedRoundId}>
            {rounds.map(r => (
              <Option key={r.id} value={r.id}>{r.name} — {r.semester}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<ReloadOutlined />}
            loading={loading} onClick={handleLoadReport}
            style={{ background: FAP_COLORS.primary }}>
            Load Report
          </Button>
          <Button icon={<ApiOutlined />} loading={grpcLoading} onClick={handleLoadGrpc}
            style={{ borderColor: FAP_COLORS.secondary, color: FAP_COLORS.secondary }}>
            Load via gRPC
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="local" items={[
        {
          key: 'local',
          label: <span><BarChartOutlined /> Local Report</span>,
          children: (
            <Spin spinning={loading}>
              {report ? (
                <>
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={4}>{statCard('Total Groups', report.totalGroups, '#003087')}</Col>
                    <Col span={4}>{statCard('Total Lecturers', report.totalLecturers, '#1677ff')}</Col>
                    <Col span={4}>{statCard('Total Slots', report.totalSlots, '#fa8c16')}</Col>
                    <Col span={4}>{statCard('Scheduled Groups', report.scheduledGroups, '#52c41a')}</Col>
                    <Col span={4}>{statCard('Success Rate', report.schedulingSuccessRate, '#722ed1', '%')}</Col>
                    <Col span={4}>{statCard('Slot Utilization', report.slotUtilizationRate, '#13c2c2', '%')}</Col>
                  </Row>

                  <div className="page-card">
                    <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
                      Scheduling Success
                    </Title>
                    <Progress
                      percent={report.schedulingSuccessRate}
                      strokeColor={{ '0%': '#003087', '100%': '#52c41a' }}
                      status={report.schedulingSuccessRate === 100 ? 'success' : 'active'}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {report.scheduledGroups} of {report.totalGroups} groups scheduled
                    </Text>
                  </div>

                  <div className="page-card">
                    <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
                      Lecturer Workload Distribution
                    </Title>
                    <Table
                      dataSource={report.lecturerWorkloads}
                      columns={[
                        { title: 'Lecturer', dataIndex: 'lecturerName', key: 'lecturerName' },
                        { title: 'Reviews', dataIndex: 'assignedReviews', key: 'assignedReviews',
                          render: (v: number) => <Tag color="blue">{v} reviews</Tag> }
                      ]}
                      rowKey="lecturerName" size="small" pagination={false}
                    />
                  </div>
                </>
              ) : (
                <Alert type="info" showIcon message="Select a round and click 'Load Report'" />
              )}
            </Spin>
          ),
        },
        {
          key: 'grpc',
          label: <span><ApiOutlined /> gRPC Report</span>,
          children: (
            <Spin spinning={grpcLoading}>
              {grpcReport ? (
                <>
                  <Alert type="success" showIcon
                    message="Data fetched via gRPC (REST API → gRPC Service → Database)"
                    style={{ marginBottom: 16 }} />
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={4}>{statCard('Total Groups', grpcReport.totalGroups, '#003087')}</Col>
                    <Col span={4}>{statCard('Total Lecturers', grpcReport.totalLecturers, '#1677ff')}</Col>
                    <Col span={4}>{statCard('Total Slots', grpcReport.totalSlots, '#fa8c16')}</Col>
                    <Col span={4}>{statCard('Scheduled Groups', grpcReport.scheduledGroups, '#52c41a')}</Col>
                    <Col span={4}>{statCard('Success Rate', grpcReport.schedulingSuccessRate, '#722ed1', '%')}</Col>
                    <Col span={4}>{statCard('Slot Utilization', grpcReport.slotUtilizationRate, '#13c2c2', '%')}</Col>
                  </Row>

                  {status && (
                    <div className="page-card">
                      <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
                        Scheduling Status (via gRPC)
                      </Title>
                      <Row gutter={12}>
                        <Col span={6}><Tag color="blue" style={{ padding: '4px 12px' }}>Status: {status.status}</Tag></Col>
                        <Col span={6}><Tag color="default">Total: {status.totalSchedules}</Tag></Col>
                        <Col span={6}><Tag color="green">Published: {status.publishedSchedules}</Tag></Col>
                        <Col span={6}><Tag color="purple">Completed: {status.completedSchedules}</Tag></Col>
                      </Row>
                    </div>
                  )}

                  {workload.length > 0 && (
                    <div className="page-card">
                      <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
                        Lecturer Workload (via gRPC)
                      </Title>
                      <Table dataSource={workload} columns={workloadColumns}
                        rowKey="lecturerId" size="small" pagination={false} />
                    </div>
                  )}
                </>
              ) : (
                <Alert type="info" showIcon
                  message="Select a round and click 'Load via gRPC' to demonstrate REST → gRPC communication" />
              )}
            </Spin>
          ),
        },
      ]} />
    </MainLayout>
  )
}
