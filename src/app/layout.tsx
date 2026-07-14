'use client'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { FAP_COLORS } from '@/lib/constants'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <title>PRS – Project Review Scheduling</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: FAP_COLORS.primary,
                colorSuccess: FAP_COLORS.success,
                colorWarning: FAP_COLORS.warning,
                colorError: FAP_COLORS.error,
                borderRadius: 4,
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: 13,
              },
              components: {
                Menu: {
                  darkItemBg: FAP_COLORS.sidebarBg,
                  darkSubMenuItemBg: '#001240',
                  darkItemSelectedBg: FAP_COLORS.sidebarActive,
                  darkItemColor: FAP_COLORS.sidebarText,
                },
                Table: {
                  headerBg: FAP_COLORS.tableHeader,
                  headerColor: FAP_COLORS.primary,
                  headerSortActiveBg: '#dce8ff',
                },
                Button: { primaryShadow: 'none' },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
