'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Card, Alert, Typography, Divider, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/services'

const { Title, Text } = Typography

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(values)
      if (res.data.success) {
        setAuth(res.data.data)
        router.push('/dashboard')
      } else {
        setError(res.data.message)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#003087',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* FAP-style top banner */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          fontSize: 42, fontWeight: 900, color: '#E87722',
          letterSpacing: 4, fontFamily: 'Arial Black, sans-serif'
        }}>
          FPT
        </div>
        <div style={{ color: '#c8d6f0', fontSize: 14, marginTop: 4 }}>
          FPT University – Academic Portal
        </div>
      </div>

      <Card
        style={{
          width: 420, borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: 'none',
        }}
      >
        {/* Card header like FAP */}
        <div style={{
          background: '#003087', margin: '-24px -24px 24px -24px',
          padding: '16px 24px', borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#E87722', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserOutlined style={{ color: 'white', fontSize: 16 }} />
          </div>
          <Title level={5} style={{ color: 'white', margin: 0 }}>
            Project Review Scheduling System
          </Title>
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
          Sign in with your university account
        </Text>

        {error && (
          <Alert message={error} type="error" showIcon
            style={{ marginBottom: 16, fontSize: 12 }} />
        )}

        <Form onFinish={onFinish} layout="vertical" size="middle">
          <Form.Item
            name="email"
            label={<span style={{ fontSize: 12, fontWeight: 600 }}>Email</span>}
            rules={[{ required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email format' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="yourname@university.edu"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontSize: 12, fontWeight: 600 }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="Password"
            />
          </Form.Item>

          <Button
            type="primary" htmlType="submit" block loading={loading}
            style={{ height: 40, fontSize: 14, background: '#003087', marginTop: 4 }}
          >
            Sign In
          </Button>
        </Form>

        <Divider style={{ margin: '20px 0 12px', fontSize: 11, color: '#999' }}>
          Demo Accounts
        </Divider>

        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {[
              ['Moderator', 'moderator@university.edu', 'Moderator@123'],
              ['Lecturer',  'lecturer1@university.edu', 'Lecturer@123'],
              ['Student',   'student01@university.edu', 'Student@123'],
            ].map(([role, email, pass]) => (
              <div key={role} style={{
                background: '#f5f5f5', padding: '4px 10px',
                borderRadius: 4, display: 'flex', gap: 8
              }}>
                <Text strong style={{ fontSize: 11, color: '#003087', minWidth: 70 }}>
                  {role}:
                </Text>
                <Text style={{ fontSize: 11 }}>{email} / {pass}</Text>
              </div>
            ))}
          </Space>
        </div>
      </Card>

      <Text style={{ color: '#7a9fd4', fontSize: 11, marginTop: 20 }}>
        © 2025 FPT University – PRN232 Final Project
      </Text>
    </div>
  )
}
