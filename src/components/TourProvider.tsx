'use client'

import { type ReactNode } from 'react'
import { OnbordaProvider, Onborda, type Step } from 'onborda'
import { format } from 'date-fns'
import { TourCard } from './TourCard'

const today = format(new Date(), 'yyyy-MM-dd')

type Tour = { tour: string; steps: Step[] }

const tours: Tour[] = [
  {
    tour: 'main',
    steps: [
      // ── 1. Welcome ────────────────────────────────────────────────────────
      {
        icon: <>📖</>,
        title: 'Chào mừng đến Daily English!',
        content: (
          <p>
            Đây là nhật ký học tiếng Anh cá nhân của bạn — thiết kế theo mô hình{' '}
            <strong>30-day sprint</strong>. Mỗi ngày bạn hoàn thành <strong>7 trạm</strong> để
            tích lũy từ vựng, luyện viết và phản chiếu. Hãy để mình dẫn bạn qua toàn bộ app!
          </p>
        ),
        selector: '#tour-log-header',
        side: 'bottom',
        pointerPadding: 12,
        pointerRadius: 14,
      },

      // ── 2. 7-step route map ───────────────────────────────────────────────
      {
        icon: <>🗺️</>,
        title: "Today's Route — 7 trạm mỗi ngày",
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>
              Sidebar bên trái là bản đồ hành trình của bạn. Mỗi ngày gồm 7 trạm theo thứ tự:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['01', 'Vocabulary', '10 từ mới mỗi ngày'],
                ['02', 'Spaced Review', 'Ôn lại từ hôm qua'],
                ['03', 'Flashcards', 'Lật thẻ ghi nhớ'],
                ['04', 'Quiz', 'Kiểm tra nhanh'],
                ['05', 'Writing', 'Viết 5–8 câu'],
                ['06', 'Analyze', 'Sửa lỗi Việt hóa'],
                ['07', 'Reflect', 'Ghi nhật ký cuối buổi'],
              ].map(([num, name, sub]) => (
                <div key={num} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10, fontWeight: 700, color: 'var(--ink-3)',
                    flexShrink: 0, minWidth: 20,
                  }}>{num}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {sub}</span>
                </div>
              ))}
            </div>
          </div>
        ),
        selector: '#tour-log-route',
        side: 'right',
        pointerPadding: 10,
        pointerRadius: 14,
      },

      // ── 3. Main content area ──────────────────────────────────────────────
      {
        icon: <>✏️</>,
        title: 'Khu vực học chính',
        content: (
          <p>
            Đây là nơi bạn thực sự học. Bấm vào từng trạm bên sidebar để chuyển nội dung. Mỗi
            trạm có nút <strong>&quot;Continue&quot;</strong> để chuyển sang trạm tiếp theo khi bạn xong.
            Tất cả tiến trình được lưu <strong>tự động</strong> — không cần lo mất dữ liệu.
          </p>
        ),
        selector: '#tour-log-main',
        side: 'left',
        pointerPadding: 12,
        pointerRadius: 14,
      },

      // ── 4. Tonight checklist ──────────────────────────────────────────────
      {
        icon: <>✅</>,
        title: 'Checklist buổi tối',
        content: (
          <p>
            Sidebar phải hiển thị checklist 6 mục cần hoàn thành mỗi buổi. Khi bạn tick đủ hết,
            app sẽ xác nhận ngày học thành công và cộng vào{' '}
            <strong>streak</strong> của bạn. Đừng để streak bị gãy!
          </p>
        ),
        selector: '#tour-log-checklist',
        side: 'left',
        pointerPadding: 10,
        pointerRadius: 14,
      },

      // ── 5. Plan nav → navigate to /plan ──────────────────────────────────
      {
        icon: <>📅</>,
        title: 'Kế hoạch 30 ngày',
        content: (
          <p>
            Trang <strong>Plan</strong> giúp bạn generate nội dung học cho từng tuần — phrases,
            vocabulary, grammar, speaking và mini-test. Tiếp theo mình sẽ dẫn bạn vào đây.
          </p>
        ),
        selector: '#nav-plan',
        side: 'bottom',
        pointerPadding: 8,
        pointerRadius: 10,
        nextRoute: '/plan',
      },

      // ── 6. Plan page ──────────────────────────────────────────────────────
      {
        icon: <>🗓️</>,
        title: 'Sprint 4 tuần của bạn',
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>
              Chọn tuần (1–4), chọn chủ đề học, rồi bấm{' '}
              <strong style={{ background: 'var(--lime)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                Generate Plan
              </strong>{' '}
              — AI sẽ tạo toàn bộ nội dung cho bạn.
            </p>
            <p>
              Mỗi tuần có <strong>5 tab</strong>: Phrases · Vocabulary · Grammar · Speaking · Test.
              Plan được lưu local — generate một lần, dùng cả tuần.
            </p>
          </div>
        ),
        selector: '#tour-plan-page',
        side: 'bottom',
        pointerPadding: 12,
        pointerRadius: 14,
        nextRoute: '/conversation',
      },

      // ── 7. Conversation page ──────────────────────────────────────────────
      {
        icon: <>💬</>,
        title: 'Luyện hội thoại với AI',
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>
              Trang <strong>Practice</strong> là nơi bạn luyện nói và viết tiếng Anh thực tế với
              AI partner tên <em>Jake</em>.
            </p>
            <p>
              Chọn <strong>6 kịch bản</strong> khác nhau: nhà hàng, phỏng vấn, cuộc họp, chỉ
              đường, mua sắm, sân bay — hoặc chế độ <strong>Free Chat</strong> tự do. Jake cũng
              coaching grammar inline!
            </p>
          </div>
        ),
        selector: '#tour-conversation-page',
        side: 'bottom',
        pointerPadding: 12,
        pointerRadius: 14,
        nextRoute: '/vocabulary-bank',
      },

      // ── 8. Vocabulary bank ────────────────────────────────────────────────
      {
        icon: <>📚</>,
        title: 'Kho từ vựng của bạn',
        content: (
          <p>
            Tất cả từ bạn đã học được tổng hợp tại đây. Lọc theo tuần, tìm kiếm, nghe phát âm
            và theo dõi <strong>mastery %</strong> — biết được từ nào bạn đã thực sự nhớ, từ nào
            cần ôn thêm.
          </p>
        ),
        selector: '#tour-vocab-page',
        side: 'bottom',
        pointerPadding: 12,
        pointerRadius: 14,
        nextRoute: '/progress',
      },

      // ── 9. Progress page ──────────────────────────────────────────────────
      {
        icon: <>📊</>,
        title: 'Tiến độ & Streak của bạn',
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>
              Trang <strong>Progress</strong> cho bạn thấy toàn cảnh hành trình học:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div><strong>Streak</strong> — số ngày liên tiếp không bỏ</div>
              <div><strong>Calendar</strong> — tổng quan tháng, ngày nào học ngày nào không</div>
              <div><strong>Milestones</strong> — huy hiệu khi đạt mốc 7 ngày, 50 từ, 30 ngày...</div>
              <div><strong>Weekly breakdown</strong> — mục tiêu 60 từ/tuần</div>
            </div>
            <p style={{ marginTop: 8, color: 'var(--lime)', fontWeight: 600 }}>
              Bạn đã sẵn sàng! Hãy bắt đầu ngày học đầu tiên.
            </p>
          </div>
        ),
        selector: '#tour-progress-page',
        side: 'bottom',
        pointerPadding: 12,
        pointerRadius: 14,
        nextRoute: `/log/${today}`,
      },
    ],
  },
]

export function TourProvider({ children }: { children: ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={tours}
        showOnborda={true}
        shadowRgb="13,27,42"
        shadowOpacity="0.75"
        cardComponent={TourCard}
      >
        {children}
      </Onborda>
    </OnbordaProvider>
  )
}
