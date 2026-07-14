'use client'
import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Typography, message, Space, Tag, Card, Row, Col } from 'antd'
import { HomeOutlined, PlusOutlined } from '@ant-design/icons'
import MainLayout from '@/components/layout/MainLayout'
import { roomsApi } from '@/lib/services'
import { FAP_COLORS } from '@/lib/constants'
import type { RoomDto } from '@/types'

const { Text, Title } = Typography

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomDto[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const loadRooms = async () => {
    setLoading(true)
    try {
      const res = await roomsApi.getAll()
      setRooms(Array.isArray(res.data) ? res.data : [])
    } catch { message.error('Failed to load rooms') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadRooms() }, [])

  const handleCreate = async (values: any) => {
    try {
      await roomsApi.create(values.name, values.capacity)
      message.success('Room created!')
      setCreateOpen(false)
      form.resetFields()
      loadRooms()
    } catch { message.error('Failed to create room') }
  }

  const columns = [
    { title: '#', key: 'i', width: 50,
      render: (_: any, __: any, i: number) => <Text type="secondary">{i + 1}</Text> },
    { title: 'Room Name', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text strong style={{ color: FAP_COLORS.primary }}><HomeOutlined /> {v}</Text> },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity',
      render: (v: number) => v ? <Tag color="blue">{v} seats</Tag> : <Text type="secondary">—</Text> },
  ]

  return (
    <MainLayout>
      <div className="page-title-bar">
        <h2><HomeOutlined /> Rooms</h2>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: FAP_COLORS.primary }}
          onClick={() => setCreateOpen(true)}>
          Add Room
        </Button>
      </div>

      {/* Room cards */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {rooms.map(room => (
          <Col span={4} key={room.id}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 6,
              borderTop: `3px solid ${FAP_COLORS.primary}` }}>
              <HomeOutlined style={{ fontSize: 24, color: FAP_COLORS.primary }} />
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{room.name}</div>
              {room.capacity
                ? <Tag color="blue" style={{ marginTop: 4 }}>{room.capacity} seats</Tag>
                : <Tag color="default" style={{ marginTop: 4 }}>No limit</Tag>
              }
            </Card>
          </Col>
        ))}
      </Row>

      <div className="page-card">
        <Table dataSource={rooms} columns={columns}
          rowKey="id" size="small" loading={loading}
          pagination={false} />
      </div>

      <Modal title="Add Room" open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        okButtonProps={{ style: { background: FAP_COLORS.primary } }}>
        <Form form={form} onFinish={handleCreate} layout="vertical" size="small">
          <Form.Item name="name" label="Room Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. A101" />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity (optional)">
            <InputNumber min={1} placeholder="30" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  )
}
