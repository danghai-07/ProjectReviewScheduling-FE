'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Button, Card, Row, Col, Tag, Typography, message,
  Statistic, Badge, Space, Popconfirm, Alert, Switch, Empty, Tooltip,
} from 'antd'
import {
  MonitorOutlined, ThunderboltOutlined, ReloadOutlined,
  ApiOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { systemApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { SystemEventDto, SystemStatusDto } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const POLL_MS = 4000

// Colour per Redis channel / source so the live feed is easy to scan.
const CHANNEL_COLORS: Record<string, string> = {
  'schedule:generated': 'blue',
  'schedule:published': 'green',
  'schedule:reminder': 'orange',
  'schedule:completed': 'purple',
  background: 'geekblue',
}

export default function MonitoringPage() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<SystemEventDto[]>([])
  const [status, setStatus] = useState<SystemStatusDto | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastFetch, setLastFetch] = useState<string>('')
  const [reachable, setReachable] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isModerator = user?.role === 'Moderator'

  const fetchData = async () => {
    try {
      const [ev, st] = await Promise.all([
        systemApi.getEvents(100),
        systemApi.getStatus(),
      ])
      setEvents(ev.data.data || [])
      setStatus(st.data.data)
      setReachable(true)
      setLastFetch(dayjs().format('HH:mm:ss'))
    } catch {
      setReachable(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Polling loop — toggled by the auto-refresh switch.
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(fetchData, POLL_MS)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh])

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      const res = await systemApi.triggerJob()
      if (res.data.success) {
        const r = res.data.data
        message.success(
          `Job ran: ${r.schedulesProcessed} schedule(s), ${r.remindersSent} reminder(s), ${r.staleCleaned} cleaned.`
        )
        fetchData()
      } else {
        message.error(res.data.message)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to trigger background job')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><MonitorOutlined /> System Monitoring</h2>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Auto-refresh
          </Text>
          <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
          <Button icon={<ReloadOutlined />} size="small" onClick={fetchData}>
            Refresh
          </Button>
        </Space>
      </div>

      {!reachable && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }}
          message="Cannot reach the API"
          description="The monitoring endpoints are not responding. Make sure the API (:8080) and Redis are running." />
      )}

      {/* Status cards */}
      <Row gutter={12} style={{ marginBottom: 4 }}>
        <Col span={6}>
          <Card size="small" style={{ borderTop: `3px solid ${status?.redisConnected ? FAP_COLORS.success : FAP_COLORS.error}` }}>
            <Statistic
              title="Redis Broker"
              value={status?.redisConnected ? 'Connected' : 'Disconnected'}
              valueStyle={{ color: status?.redisConnected ? FAP_COLORS.success : FAP_COLORS.error, fontSize: 18 }}
              prefix={status?.redisConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderTop: `3px solid ${FAP_COLORS.primary}` }}>
            <Statistic title="Events Captured" value={status?.eventCount ?? 0}
              valueStyle={{ color: FAP_COLORS.primary }} prefix={<ApiOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderTop: `3px solid ${FAP_COLORS.secondary}` }}>
            <Statistic
              title="Last Job Run"
              value={status?.lastJobRun ? dayjs(status.lastJobRun.ranAt).format('DD/MM HH:mm') : 'Never'}
              valueStyle={{ color: FAP_COLORS.secondary, fontSize: 18 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic title="Reminders (last run)"
              value={status?.lastJobRun?.remindersSent ?? 0}
              valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Background job control */}
      <div className="page-card">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={5} style={{ margin: 0, color: FAP_COLORS.primary }}>
              <ThunderboltOutlined /> Background Job
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              The reminder job runs automatically every 1 hour. Trigger it now instead of waiting.
            </Text>
          </Col>
          <Col>
            {!isModerator && (
              <Tooltip title="Only Moderators can trigger the background job">
                <Button icon={<ThunderboltOutlined />} disabled>Trigger Job Now</Button>
              </Tooltip>
            )}
            {isModerator && (
              <Popconfirm
                title="Trigger Background Job"
                description="This runs the reminder + cleanup job immediately. Continue?"
                onConfirm={handleTrigger}
                okButtonProps={{ style: { background: FAP_COLORS.primary } }}
              >
                <Button type="primary" icon={<ThunderboltOutlined />} loading={triggering}
                  style={{ background: FAP_COLORS.primary }}>
                  Trigger Job Now
                </Button>
              </Popconfirm>
            )}
          </Col>
        </Row>
      </div>

      {/* Live event feed */}
      <div className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: FAP_COLORS.primary }}>
            <ApiOutlined /> Live Event Feed
            <Badge
              status={autoRefresh ? 'processing' : 'default'}
              text={autoRefresh ? 'live' : 'paused'}
              style={{ marginLeft: 12, fontSize: 12 }}
            />
          </Title>
          {lastFetch && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Updated {lastFetch} · polling every {POLL_MS / 1000}s
            </Text>
          )}
        </div>

        {events.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                No events yet. Generate/publish a schedule or trigger the job to see Redis events here.
              </Text>
            } />
        ) : (
          <div style={{
            background: '#0d1117', borderRadius: 6, padding: 12,
            maxHeight: 480, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12,
          }}>
            {events.map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'baseline',
                padding: '3px 0', borderBottom: '1px solid #161b22',
              }}>
                <span style={{ color: '#8b949e', whiteSpace: 'nowrap' }}>
                  {dayjs(e.timestamp).format('HH:mm:ss')}
                </span>
                <Tag color={e.source === 'Redis' ? 'purple' : 'geekblue'} style={{ margin: 0, fontSize: 10 }}>
                  {e.source}
                </Tag>
                <Tag color={CHANNEL_COLORS[e.channel] || 'default'} style={{ margin: 0, fontSize: 10 }}>
                  {e.channel}
                </Tag>
                <span style={{ color: '#c9d1d9', wordBreak: 'break-all' }}>{e.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
