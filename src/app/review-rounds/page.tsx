'use client'
import { useEffect, useState } from 'react'
import {
  Table, Button, Tag, Modal, Form, Input, InputNumber,
  DatePicker, Select, Space, Typography, Tooltip, Drawer,
  message, Popconfirm, Spin, Badge, TimePicker
} from 'antd'
import {
  PlusOutlined, EyeOutlined, EditOutlined,
  ClockCircleOutlined, CalendarOutlined,
} from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roundsApi } from '@/lib/services'
import { STATUS_COLORS, FAP_COLORS, SEMESTERS } from '@/lib/constants'
import type { ReviewRoundDto, ReviewSlotDto, RoundStatus } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

const STATUS_OPTIONS: RoundStatus[] = [
  'Draft', 'RegistrationOpen', 'Scheduling', 'Published', 'Completed'
]

export default function ReviewRoundsPage() {
  const [rounds, setRounds] = useState<ReviewRoundDto[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [slotsOpen, setSlotsOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState<ReviewRoundDto | null>(null)
  const [slots, setSlots] = useState<ReviewSlotDto[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [addSlotOpen, setAddSlotOpen] = useState(false)
  const [form] = Form.useForm()
  const [slotForm] = Form.useForm()

  const loadRounds = async () => {
    setLoading(true)
    try {
      const res = await roundsApi.getAll()
      setRounds(res.data.data || [])
    } catch { message.error('Failed to load review rounds') }
    finally { setLoading(false) }
  }

  const loadSlots = async (roundId: string) => {
    setSlotsLoading(true)
    try {
      const res = await roundsApi.getSlots(roundId)
      setSlots(res.data.data || [])
    } catch { message.error('Failed to load slots') }
    finally { setSlotsLoading(false) }
  }

  useEffect(() => { loadRounds() }, [])

  const handleCreate = async (values: any) => {
    try {
      await roundsApi.create({
        name: values.name,
        semester: values.semester,
        registrationStartDate: values.dateRange[0].toISOString(),
        registrationEndDate: values.dateRange[1].toISOString(),
        maxGroupsPerSlot: values.maxGroupsPerSlot,
        requiredLecturersPerSlot: values.requiredLecturersPerSlot,
      })
      message.success('Review round created!')
      setCreateOpen(false)
      form.resetFields()
      loadRounds()
    } catch { message.error('Failed to create review round') }
  }

  const handleStatusChange = async (id: string, status: RoundStatus) => {
    try {
      await roundsApi.updateStatus(id, status)
      message.success('Status updated!')
      loadRounds()
    } catch { message.error('Failed to update status') }
  }

  const handleViewSlots = (round: ReviewRoundDto) => {
    setSelectedRound(round)
    loadSlots(round.id)
    setSlotsOpen(true)
  }

  const handleAddSlot = async (values: any) => {
    if (!selectedRound) return
    try {
      await roundsApi.createSlot(selectedRound.id, {
        date: values.date.toISOString(),
        startTime: values.startTime.format('HH:mm:ss'),
        endTime: values.endTime.format('HH:mm:ss'),
      })
      message.success('Slot added!')
      setAddSlotOpen(false)
      slotForm.resetFields()
      loadSlots(selectedRound.id)
    } catch { message.error('Failed to add slot') }
  }

  const columns = [
    {
      title: '#', key: 'index',
      render: (_: any, __: any, i: number) =>
        <Text type="secondary" style={{ fontSize: 11 }}>{i + 1}</Text>,
      width: 40,
    },
    {
      title: 'Round Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong style={{ color: FAP_COLORS.primary }}>{v}</Text>,
    },
    { title: 'Semester', dataIndex: 'semester', key: 'semester', width: 110 },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 140,
      render: (s: RoundStatus, row: ReviewRoundDto) => (
        <Select
          value={s} size="small" style={{ width: 130 }}
          onChange={(val) => handleStatusChange(row.id, val as RoundStatus)}
        >
          {STATUS_OPTIONS.map(opt => (
            <Option key={opt} value={opt}>
              <Tag color={STATUS_COLORS[opt]} style={{ margin: 0 }}>{opt}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Reg. Period', key: 'reg',
      render: (row: ReviewRoundDto) => (
        <Text style={{ fontSize: 11 }}>
          {dayjs(row.registrationStartDate).format('DD/MM/YY')} →{' '}
          {dayjs(row.registrationEndDate).format('DD/MM/YY')}
        </Text>
      ),
    },
    {
      title: 'Config', key: 'config',
      render: (row: ReviewRoundDto) => (
        <Space size={4}>
          <Tag color="blue">Max {row.maxGroupsPerSlot} groups</Tag>
          <Tag color="purple">Req {row.requiredLecturersPerSlot} lecturers</Tag>
        </Space>
      ),
    },
    {
      title: 'Slots', dataIndex: 'totalSlots', key: 'totalSlots', width: 70,
      render: (v: number) => <Badge count={v} showZero color="#003087" />,
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (row: ReviewRoundDto) => (
        <Space>
          <Tooltip title="View Slots">
            <Button size="small" icon={<ClockCircleOutlined />}
              onClick={() => handleViewSlots(row)} />
          </Tooltip>
          <Tooltip title="View Detail">
            <Button size="small" icon={<EyeOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const slotColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY (ddd)') },
    { title: 'Start', dataIndex: 'startTime', key: 'startTime',
      render: (v: string) => v?.substring(0, 5) },
    { title: 'End', dataIndex: 'endTime', key: 'endTime',
      render: (v: string) => v?.substring(0, 5) },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><CalendarOutlined /> Review Rounds</h2>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: FAP_COLORS.primary }}
          onClick={() => setCreateOpen(true)}>
          Create Round
        </Button>
      </div>

      <div className="page-card">
        <Spin spinning={loading}>
          <Table
            dataSource={rounds} columns={columns}
            rowKey="id" size="small"
            pagination={{ pageSize: 10, showTotal: (t) => `Total: ${t} rounds` }}
          />
        </Spin>
      </div>

      {/* Create Round Modal */}
      <Modal title="Create Review Round" open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields() }}
        onOk={() => form.submit()} okText="Create"
        okButtonProps={{ style: { background: FAP_COLORS.primary } }}>
        <Form form={form} onFinish={handleCreate} layout="vertical" size="small">
          <Form.Item name="name" label="Round Name"
            rules={[{ required: true }]}>
            <Input placeholder="e.g. Review Round 1" />
          </Form.Item>
          <Form.Item name="semester" label="Semester"
            rules={[{ required: true }]}>
            <Select placeholder="Select semester">
              {SEMESTERS.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="Registration Period"
            rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={8}>
            <Form.Item name="maxGroupsPerSlot" label="Max Groups/Slot"
              initialValue={3} rules={[{ required: true }]}>
              <InputNumber min={1} max={10} />
            </Form.Item>
            <Form.Item name="requiredLecturersPerSlot" label="Required Lecturers/Slot"
              initialValue={2} rules={[{ required: true }]}>
              <InputNumber min={1} max={10} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Slots Drawer */}
      <Drawer
        title={<>Slots — <Text style={{ color: FAP_COLORS.secondary }}>{selectedRound?.name}</Text></>}
        open={slotsOpen} onClose={() => setSlotsOpen(false)} width={480}
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />}
            style={{ background: FAP_COLORS.primary }}
            onClick={() => setAddSlotOpen(true)}>
            Add Slot
          </Button>
        }>
        <Spin spinning={slotsLoading}>
          <Table dataSource={slots} columns={slotColumns}
            rowKey="id" size="small" pagination={false} />
        </Spin>

        <Modal title="Add Review Slot" open={addSlotOpen}
          onCancel={() => { setAddSlotOpen(false); slotForm.resetFields() }}
          onOk={() => slotForm.submit()} okText="Add">
          <Form form={slotForm} onFinish={handleAddSlot} layout="vertical" size="small">
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Space>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
              <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
            </Space>
          </Form>
        </Modal>
      </Drawer>
    </MainLayout>
  )
}
