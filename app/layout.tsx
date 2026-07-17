import type { Metadata, Viewport } from 'next'
import { Inter, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-vietnam',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Báo Cơm | Đăng ký suất ăn công ty',
  description: 'Hệ thống báo cơm nhân viên - Quản lý suất ăn trưa hàng ngày',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍽️</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${inter.variable} ${beVietnamPro.variable}`}>
      <head>
        {/* Vượt trang cảnh báo của ngrok: đính header vào MỌI request cùng origin
            (API + điều hướng RSC của Next). Chỉ áp dụng same-origin để không phá CORS. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var o=window.fetch;window.fetch=function(input,init){try{var u=typeof input==='string'?input:(input&&input.url)||'';var abs=new URL(u,location.href);if(abs.origin===location.origin){init=init||{};var h=new Headers(init.headers||(typeof input!=='string'&&input&&input.headers)||{});h.set('ngrok-skip-browser-warning','true');init.headers=h;}}catch(e){}return o.call(this,input,init);};}catch(e){}})();",
          }}
        />
        <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}