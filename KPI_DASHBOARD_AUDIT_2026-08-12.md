# K-UNIV KPI Dashboard — Rà soát & Đánh giá (2026-08-12)

Phạm vi: rà soát toàn bộ nội dung đang hiển thị trên `/dashboard` và `/dashboard/members` (dựa trên source code hiện có trong `D:\K-UNIV dashboard`), đánh giá mức độ tối ưu, và đề xuất bổ sung từ góc nhìn người quản trị dự án marketing.

---

## 1. Kiểm kê toàn bộ nội dung hiện có

### Trang chính `/dashboard`

**Mục "사용자" (Người dùng)** — nguồn: `lib/data/kuniv.ts`, dữ liệu từ `memberListSnapshot.json` (crawl thủ công từ K-UNIV admin panel).
- 3 thẻ số: 전체 회원 (tổng, kèm "활성" phụ), 이번 달 신규 회원 (theo tháng dương lịch), 탈퇴 (lũy kế)
- Biểu đồ đường "신규 회원 추이" (gia nhập theo ngày), có bộ lọc 7 ngày / 30 ngày / tháng này / tuỳ chỉnh
- Badge "실데이터 · cập nhật thủ công" hiển thị ngày `fetchedAt`

**Mục "마케팅 채널" (Kênh marketing)** — nguồn: `lib/data/sheets.ts`, đọc trực tiếp tab `[K-UNIV]성과` trên Google Sheet qua CSV công khai (không cần credentials, luôn real-time).
- 콘텐츠 성과: 5 thẻ — phát hành, tổng lượt xem, thích, bình luận, chia sẻ (tất cả tính theo D+7, bỏ qua giá trị null thay vì coi là 0)
- 일별 조회수: biểu đồ đường theo ngày, có bộ lọc ngày, dùng "best available" (D+7 → D+3 → D+1) để không bị trống 7 ngày gần nhất
- BEST 콘텐츠: top 5 bài theo view/like/comment/share, có link tới bài gốc
- 채널별 발행: số bài theo kênh (thanh ngang)
- 채널별 성과: bảng view/like/comment/share theo từng kênh

### Trang phụ `/dashboard/members`
- 국가별 분포: số lượng theo quốc gia (chỉ tính "실제 회원", loại trừ tài khoản trường/đối tác)
- 월별 신규 가입: số liệu theo tháng, click để xem danh sách; vừa thêm highlight xanh pastel + nhận xét tăng trưởng (so tháng 7 với tổng 4 tháng trước, so tháng 8 với tháng 7)
- Danh sách tên từng 실제 회원 (tên, quốc gia, ngày gia nhập, trạng thái)
- Danh sách tài khoản 학교 관계자/직원 (tên + đơn vị)

### Đã code nhưng đang ẩn (không render trên trang)
- `SignupSourceSection` (가입 유입경로 — nguồn gia nhập theo kênh) và `ConversionSection` (전환 성과 — lượt truy cập, tỷ lệ chuyển đổi) đã viết sẵn component, nhưng bị comment-out trong `app/dashboard/page.tsx` vì phụ thuộc GA4, mà K-UNIV **chưa có GA4** (đã xác nhận 2026-07-26, trang "접속 통계" trong admin cũng đang trống). `lib/data/ga4.ts` hiện chỉ trả mock data.

---

## 2. Đánh giá mức độ tối ưu

**Điểm đang làm tốt:**
- Logic null-safe cho D+7/D+3/D+1 rất chặt — không bao giờ biến "chưa đủ thời gian đo" thành số 0 giả, tránh làm sai lệch KPI. Đây là điểm cộng lớn, nhiều dashboard khác hay mắc lỗi này.
- Google Sheet đọc qua CSV công khai, không cần service account, tự động cập nhật mỗi lần tải trang — đúng tinh thần "real-time" mà không tăng rủi ro bảo mật.
- Có drill-down (click thẻ/tháng để xem danh sách chi tiết) — tốt cho việc truy vết số liệu thay vì chỉ nhìn con số tổng.
- Phân tách 실제 회원 vs 학교 관계자 để KPI người dùng không bị nhiễu bởi tài khoản nội bộ/đối tác — quyết định đúng.

**Điểm chưa tối ưu:**
- 3 thẻ KPI người dùng ở trang chính (전체 회원, 이번 달 신규, 탈퇴) chỉ hiển thị số tuyệt đối, **không có so sánh với kỳ trước** hay xu hướng (%, mũi tên tăng/giảm) — trong khi trang `/members` vừa được bổ sung phần so sánh tăng trưởng khá chi tiết. Nên đưa tín hiệu tương tự lên đúng chỗ người quản trị nhìn đầu tiên (trang chính).
- "이번 달 신규 회원" tính theo tháng dương lịch nhưng không có ngữ cảnh "đã qua bao nhiêu ngày trong tháng" — đầu tháng con số sẽ nhìn như sụt giảm dù thực ra là bình thường.
- 채널별 발행/채널별 성과 chỉ có số tuyệt đối (tổng view/like/comment theo kênh), **không có hiệu suất trung bình/bài** (views trung bình mỗi post). Kênh đăng nhiều bài sẽ luôn có tổng cao hơn dù hiệu quả từng bài kém — dễ dẫn đến quyết định phân bổ ngân sách sai.
- Không có cảnh báo dữ liệu cũ (staleness). `memberListSnapshot.json` là crawl thủ công — như vừa gặp hôm nay, dữ liệu có thể "đứng yên" nhiều ngày mà giao diện chỉ hiện ngày `fetchedAt` nhỏ, không có cảnh báo màu đỏ khi quá hạn (vd: > 3 ngày chưa crawl lại).
- 콘텐츠 성과 và 사용자 (người dùng mới) đang là 2 khối tách biệt hoàn toàn — dashboard không có bất kỳ liên kết nào cho thấy nội dung nào/kênh nào thực sự tạo ra lượt đăng ký mới. Đây chính là phần `가입 유입경로` + `전환 성과` đã viết sẵn nhưng đang bị ẩn vì thiếu GA4.
- README.md và các file kế hoạch cũ (`DATA_SOURCE_MAP.md`, `IMPLEMENTATION_PLAN.md`...) được nhắc trong comment code nhưng không còn tồn tại trong repo hiện tại — tài liệu dự án không đồng bộ với code thực tế, dễ gây nhầm lẫn khi có người mới tham gia.

---

## 3. Đề xuất bổ sung — góc nhìn quản trị dự án

Ưu tiên theo tác động, không phải theo độ khó:

**Ưu tiên cao — đo hiệu quả marketing thực sự:**
1. **Chi phí & hiệu quả chi tiêu** (cost per signup / CAC theo kênh, tổng ngân sách đã chi vs kế hoạch). Hiện dashboard hoàn toàn không có khái niệm chi phí — với vai trò "KPI marketing", đây là thiếu sót lớn nhất. Cần thêm cột ngân sách/chi phí vào Google Sheet (hoặc sheet riêng) rồi tính CAC = chi phí / số 신규 회원 quy đổi theo kênh.
2. **Kết nối nội dung ↔ đăng ký** (attribution): kích hoạt lại `가입 유입경로` + `전환 성과` — cần K-UNIV gắn GA4 (hoặc tối thiểu UTM link cho từng bài đăng) để biết bài nào/kênh nào thực sự dẫn tới đăng ký, không chỉ dừng ở lượt xem/thích.
3. **Mục tiêu (target) theo tháng**: thêm 1 trường "chỉ tiêu 신규 회원/tháng" để mỗi thẻ KPI có thể so sánh "đạt X% mục tiêu" thay vì chỉ là con số trần trụi.

**Ưu tiên trung bình — chất lượng & hiệu suất:**
4. **Hiệu suất trung bình/bài theo kênh** (views/likes trung bình mỗi post, tỷ lệ tương tác = (like+comment+share)/view) thay vì chỉ tổng cộng dồn.
5. **Follower/subscriber theo kênh SNS** (tăng trưởng người theo dõi Instagram/TikTok/Threads/Facebook) — hiện dashboard chỉ đo hiệu suất từng bài đăng, không đo sức khỏe kênh dài hạn.
6. **Tỷ lệ tăng trưởng & churn rate** thay vì chỉ số tuyệt đối — vd: "% tăng so với tháng trước", "% 탈퇴 trên tổng số" — dễ đọc hơn cho báo cáo lên cấp trên.
7. **Cảnh báo dữ liệu cũ**: badge đỏ tự động khi `fetchedAt` của member data quá X ngày, để không ai phải "phát hiện" số liệu sai như hôm nay.

**Ưu tiên thấp hơn — tiện ích vận hành:**
8. **Xuất báo cáo** (PDF/Excel) để gửi cấp trên định kỳ mà không cần chụp màn hình.
9. **Ghi chú sự kiện trên timeline** (vd: đánh dấu "chạy campaign X" trên biểu đồ 신규 회원 추이 / 일별 조회수) để giải thích các đợt tăng đột biến — hiện đợt tăng tháng 7-8 không có chú thích lý do trên chính biểu đồ.
10. **Đồng bộ tài liệu dự án**: README/kế hoạch đang tham chiếu file không còn tồn tại — nên cập nhật lại cho khớp thực tế, tránh gây nhầm cho người sau.

---

## Tóm tắt 1 dòng cho từng ưu tiên cao nhất
Nếu chỉ chọn 1 việc làm tiếp theo: **thêm dữ liệu chi phí (ngân sách/CAC)** — vì hiện dashboard trả lời tốt câu "có bao nhiêu người dùng mới, nội dung nào hiệu quả" nhưng chưa trả lời được câu quan trọng nhất với một "KPI dashboard" là **"chi bao nhiêu để có được từng người dùng đó."**

---

## 4. Đề xuất phát triển: mục "Tổng quan dự án" cho nhà quản trị (2026-08-12)

Vấn đề gốc: hiện tại `/dashboard` có 2 khối tách rời (사용자, 마케팅 채널) — nhà quản trị phải tự cộng trừ, tự nhớ số tháng trước, tự đoán dữ liệu có mới hay không. Không có 1 chỗ duy nhất trả lời "dự án đang ổn không, có gì cần chú ý" trong 10 giây đầu tiên.

Đề xuất: thêm 1 khối mới **"종합 현황" (Tổng quan dự án)** ở đầu trang `/dashboard`, phía trên "사용자" — vì đây là thứ quản trị viên nhìn thấy đầu tiên khi mở trang.

Chia làm 2 giai đoạn, theo việc có cần dữ liệu mới hay không:

### Giai đoạn 1 — build được ngay, dùng data đang có sẵn (không cần chờ nguồn dữ liệu mới)

1. **Thanh tổng quan liên phòng ban (cross-section summary bar)** — gộp trong 1 hàng: 전체 회원, 이번 달 신규 회원 (kèm % so tháng trước), 탈퇴율 (%, không chỉ số tuyệt đối), 콘텐츠 phát hành tháng này, tổng lượt xem tháng này. Đây là bản tóm tắt "nhìn 1 lần biết hết", ghép từ dữ liệu 2 khối hiện có, không cần nguồn mới.
2. **Trend % cho 3 thẻ chính ở trang chủ** — tái dùng đúng logic `summarizeGrowth` vừa viết cho `/members` (so tháng này với tháng trước), áp lên 3 thẻ 전체 회원/신규/탈퇴 ở trang chính, để nhất quán với trang members thay vì chỉ có số trần trụi như hiện tại.
3. **Bảng so sánh nhiều kỳ (period comparison table)** — 1 bảng nhỏ: tháng này / tháng trước / tháng trước nữa, cho tất cả chỉ số chính (신규 회원, 콘텐츠 phát hành, tổng view/like/comment/share). Tiện copy thẳng vào báo cáo gửi cấp trên, không cần tự tổng hợp tay.
4. **Badge cảnh báo dữ liệu cũ (freshness alert)** — tự động chuyển badge "실데이터" hiện tại sang màu cảnh báo (vàng/đỏ) nếu `fetchedAt` của member data quá X ngày (đề xuất 3-5 ngày) chưa được crawl lại — tránh lặp lại tình huống "số liệu tháng 8 bị cũ" như vừa gặp.
5. **Tóm tắt điều hành dạng chữ (1 đoạn văn tự sinh)** — 2-3 câu ghép từ số liệu đã tính sẵn, kiểu: "Tháng 8: 55 신규 회원, tăng 62% so với tháng 7. Kênh hiệu quả nhất: Instagram (X lượt xem/bài). Dữ liệu người dùng cập nhật lần cuối: 11/8." Không cần AI phức tạp — chỉ là template string nối các hàm `aggregate.ts`/`kuniv.ts` đã có sẵn.
6. **Xếp hạng kênh theo hiệu suất trung bình/bài** (không chỉ tổng cộng dồn như 채널별 성과 hiện tại) — trả lời thẳng "kênh nào đang tốt nhất tính trên từng bài", tránh kênh đăng nhiều bài trông "thắng" ảo.

### Giai đoạn 2 — cần bổ sung nguồn dữ liệu trước khi build được

7. **Chi phí & CAC/ROI tổng quan** — cần bạn thêm cột chi phí (ngân sách đã chi theo kênh/tháng) vào Google Sheet hiện có hoặc 1 tab riêng, rồi mới tính được cost-per-signup.
8. **Mục tiêu tháng & % hoàn thành** — cần 1 nơi lưu chỉ tiêu (vd: 1 tab "Mục tiêu" trong Sheet, hoặc bạn cung cấp con số mục tiêu để mình hard-code tạm) — hiện chưa có nguồn nào lưu con số mục tiêu cả.
9. **Phễu chuyển đổi (nội dung → truy cập web → đăng ký)** — phụ thuộc GA4 hoặc tối thiểu gắn UTM link cho từng bài đăng; đây là phần đã có sẵn component (`SignupSourceSection`, `ConversionSection`) nhưng đang ẩn vì thiếu nguồn.

**Đề xuất triển khai:** làm Giai đoạn 1 trước (không tốn thời gian chờ, không cần bạn chuẩn bị gì thêm) — nếu bạn đồng ý, mình có thể bắt đầu code luôn mục 1-2 (thanh tổng quan + trend %) vì tái dùng gần như toàn bộ logic đã có. Giai đoạn 2 cần bạn quyết định trước: có sẵn sàng thêm cột chi phí vào Sheet, và có kế hoạch gắn GA4 cho k-univ.kr không.
