'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Dropdown, Avatar, Typography, Badge, Space } from 'antd'
import {
  DashboardOutlined, CalendarOutlined, TeamOutlined,
  BookOutlined, HomeOutlined, BarChartOutlined,
  UserOutlined, LogoutOutlined, BellOutlined,
  ScheduleOutlined, ApiOutlined, SettingOutlined,
  ClockCircleOutlined, CommentOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'

const { Sider, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/review-rounds', icon: <CalendarOutlined />, label: 'Review Rounds' },
  { key: '/schedules', icon: <ScheduleOutlined />, label: 'Schedules' },
  { key: '/lecturers', icon: <TeamOutlined />, label: 'Lecturers' },
  { key: '/groups', icon: <BookOutlined />, label: 'Student Groups' },
  { key: '/availability', icon: <ClockCircleOutlined />, label: 'My Availability' },
  { key: '/rooms', icon: <HomeOutlined />, label: 'Rooms' },
  { key: '/feedback', icon: <CommentOutlined />, label: 'Feedback' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/grpc-reports', icon: <ApiOutlined />, label: 'gRPC Reports' },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [selectedKey, setSelectedKey] = useState('/dashboard')

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
  }, [])

  useEffect(() => {
    const found = menuItems.find(m => pathname.startsWith(m.key))
    if (found) setSelectedKey(found.key)
  }, [pathname])

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: <span>{user?.fullName}</span>,
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        onClick: handleLogout,
        danger: true,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── FAP Header ───────────────────────────────────────────────── */}
      <div className="fap-header">
        <span className="logo">FPT</span>
        <span style={{ color: '#c8d6f0', fontSize: 18 }}>|</span>
        <span className="system-name">Project Review Scheduling System</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge count={0} size="small">
            <BellOutlined style={{ color: 'white', fontSize: 16, cursor: 'pointer' }} />
          </Badge>

          <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size={28} icon={<UserOutlined />}
                style={{ background: '#E87722' }} />
              <Text style={{ color: 'white', fontSize: 12 }}>
                {user?.fullName || 'User'}
              </Text>
              <Text style={{ color: '#c8d6f0', fontSize: 11 }}>
                [{user?.role}]
              </Text>
            </Space>
          </Dropdown>
        </div>
      </div>

      <Layout style={{ marginTop: 52 }}>
        {/* ── FAP Sidebar ──────────────────────────────────────────────── */}
        <Sider className="fap-sidebar" theme="dark" width={220}>
          {/* Semester info like FAP */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #0a2a6e',
            background: '#001240'
          }}>
            <Text style={{ color: '#7a9fd4', fontSize: 11, display: 'block' }}>Current Semester</Text>
            <Text style={{ color: '#E87722', fontSize: 13, fontWeight: 600 }}>HK1 2025</Text>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            style={{ background: '#001d54', border: 'none', marginTop: 4 }}
            items={menuItems}
          />

          {/* Bottom user info like FAP */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '10px 16px', background: '#001240',
            borderTop: '1px solid #0a2a6e'
          }}>
            <Text style={{ color: '#7a9fd4', fontSize: 11, display: 'block' }}>Logged in as</Text>
            <Text style={{ color: '#E87722', fontSize: 12 }}>{user?.email}</Text>
          </div>
        </Sider>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <Content className="fap-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
