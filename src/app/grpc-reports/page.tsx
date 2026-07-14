'use client'
import { useEffect, useState } from 'react'
import {
  Select, Button, Card, Row, Col, Table, Tag, Typography,
  message, Spin, Alert, Space, Divider, Badge, Statistic
} from 'antd'
import { ApiOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi, grpcReportsApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import type { ReviewRoundDto } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

export default function GrpcReportsPage() {
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [roundReport, setRoundReport] = useState<any>(null)
  const [workload, setWorkload] = useState<any[]>([])
  const [schedStatus, setSchedStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [callLog, setCallLog] = useState<string[]>([])

  useEffect(() => {
    roundsApi.getAll().then(r => setRounds(r.data.data || []))
  }, [])

  const log = (msg: string) =>
    setCallLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)])

  const handleFetch = async () => {
    if (!selectedRoundId) return message.warning('Please select a round')
    setLoading(true)
    setCallLog([])
    try {
      log('→ REST API: GET /api/grpc-reports/rounds/{id}/report')
      const rpt = await grpcReportsApi.getRoundReport(selectedRoundId)
      setRoundReport(rpt.data.data)
      log('✓ gRPC GetRoundReport returned data')

      log('→ REST API: GET /api/grpc-reports/rounds/{id}/workload')
      const wl = await grpcReportsApi.getWorkload(selectedRoundId)
      setWorkload(wl.data.data || [])
      log('✓ gRPC GetLecturerWorkload returned data')

      log('→ REST API: GET /api/grpc-reports/rounds/{id}/status')
      const st = await grpcReportsApi.getStatus(selectedRoundId)
      setSchedStatus(st.data.data)
      log('✓ gRPC GetSchedulingStatus returned data')

      message.success('All 3 gRPC methods called successfully!')
    } catch (err: any) {
      log(`✗ Error: ${err.message}`)
      message.error('gRPC call failed — is the gRPC service running on :5200?')
    } finally {
      setLoading(false)
    }
  }

  const workloadCols = [
    { title: 'Lecturer', dataIndex: 'lecturerName', key: 'lecturerName',
      render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Department', dataIndex: 'department', key: 'department',
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Reviews Assigned', dataIndex: 'assignedReviews', key: 'assignedReviews',
      render: (v: number) => <Badge count={v} showZero color={FAP_COLORS.primary} /> },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><ApiOutlined /> gRPC Reports</h2>
        <Tag color="purple" style={{ fontSize: 12, padding: '2px 10px' }}>
          PRN232 §2.4 — REST → gRPC Demonstration
        </Tag>
      </div>

      {/* Architecture diagram */}
      <Alert
        type="info" showIcon
        style={{ marginBottom: 16 }}
        message={
          <span>
            <strong>Flow:</strong> Browser → REST API (:8080) →{' '}
            <Tag color="purple">gRPC Client</Tag> → gRPC Service (:5200) → SQL Server
          </span>
        }
      />

      <div className="page-card">
        <Space>
          <Select placeholder="Select review round..." style={{ width: 260 }}
            value={selectedRoundId || undefined} onChange={setSelectedRoundId}>
            {rounds.map(r => (
              <Option key={r.id} value={r.id}>{r.name} — {r.semester}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<ReloadOutlined />}
            loading={loading} onClick={handleFetch}
            style={{ background: '#722ed1' }}>
            Call gRPC Service
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* Left: results */}
        <Col span={16}>
          <Spin spinning={loading}>
            {roundReport && (
              <>
                <div className="page-card">
                  <Title level={5} style={{ color: '#722ed1', marginBottom: 12 }}>
                    GetRoundReport — gRPC Response
                  </Title>
                  <Row gutter={12}>
                    {[
                      { label: 'Total Groups', value: roundReport.totalGroups, color: '#003087' },
                      { label: 'Total Lecturers', value: roundReport.totalLecturers, color: '#1677ff' },
                      { label: 'Total Slots', value: roundReport.totalSlots, color: '#fa8c16' },
                      { label: 'Scheduled', value: roundReport.scheduledGroups, color: '#52c41a' },
                      { label: 'Success Rate', value: `${roundReport.schedulingSuccessRate}%`, color: '#722ed1' },
                      { label: 'Slot Util.', value: `${roundReport.slotUtilizationRate}%`, color: '#13c2c2' },
                    ].map(s => (
                      <Col span={4} key={s.label}>
                        <Card size="small" style={{ borderTop: `3px solid ${s.color}`, borderRadius: 6 }}>
                          <div style={{ fontSize: 11, color: '#666' }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                {schedStatus && (
                  <div className="page-card">
                    <Title level={5} style={{ color: '#722ed1', marginBottom: 12 }}>
                      GetSchedulingStatus — gRPC Response
                    </Title>
                    <Space wrap>
                      <Tag color="blue" style={{ padding: '4px 12px', fontSize: 13 }}>
                        Status: <strong>{schedStatus.status}</strong>
                      </Tag>
                      <Tag color="default" style={{ padding: '4px 12px' }}>
                        Total Schedules: {schedStatus.totalSchedules}
                      </Tag>
                      <Tag color="green" style={{ padding: '4px 12px' }}>
                        Published: {schedStatus.publishedSchedules}
                      </Tag>
                      <Tag color="purple" style={{ padding: '4px 12px' }}>
                        Completed: {schedStatus.completedSchedules}
                      </Tag>
                    </Space>
                  </div>
                )}

                {workload.length > 0 && (
                  <div className="page-card">
                    <Title level={5} style={{ color: '#722ed1', marginBottom: 12 }}>
                      GetLecturerWorkload — gRPC Response
                    </Title>
                    <Table dataSource={workload} columns={workloadCols}
                      rowKey="lecturerId" size="small" pagination={false} />
                  </div>
                )}
              </>
            )}

            {!roundReport && !loading && (
              <div className="page-card" style={{ textAlign: 'center', padding: 40 }}>
                <ApiOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ color: '#999', marginTop: 12 }}>
                  Select a round and click "Call gRPC Service"
                </div>
              </div>
            )}
          </Spin>
        </Col>

        {/* Right: call log */}
        <Col span={8}>
          <div className="page-card" style={{ height: '100%' }}>
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 12 }}>
              📋 Call Log
            </Title>
            <div style={{
              background: '#0d1117', borderRadius: 6, padding: 12,
              minHeight: 300, fontFamily: 'monospace', fontSize: 11
            }}>
              {callLog.length === 0 ? (
                <span style={{ color: '#666' }}>No calls yet...</span>
              ) : (
                callLog.map((line, i) => (
                  <div key={i} style={{
                    color: line.includes('✓') ? '#52c41a'
                      : line.includes('✗') ? '#ff4d4f'
                      : '#c8d6f0',
                    marginBottom: 4
                  }}>
                    {line}
                  </div>
                ))
              )}
            </div>

            <Divider style={{ margin: '12px 0' }} />
            <Title level={5} style={{ color: FAP_COLORS.primary, marginBottom: 8, fontSize: 12 }}>
              gRPC Methods Available
            </Title>
            {[
              'GetRoundReport(reviewRoundId)',
              'GetLecturerWorkload(reviewRoundId)',
              'GetSchedulingStatus(reviewRoundId)',
            ].map(m => (
              <div key={m} style={{
                background: '#f5f0ff', border: '1px solid #d3adf7',
                borderRadius: 4, padding: '4px 8px', marginBottom: 6,
                fontSize: 11, fontFamily: 'monospace', color: '#722ed1'
              }}>
                {m}
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </MainLayout>
  )
}
