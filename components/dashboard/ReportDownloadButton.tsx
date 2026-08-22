"use client";

import { useRef, useState } from "react";
import {
  UserStats,
  MonthlyMemberCount,
  MonthlyContentSummary,
  ChannelEfficiency,
  ContentSummary,
  MemberListEntry,
} from "@/lib/types";
import ReportDocument from "@/components/dashboard/ReportDocument";

type Props = {
  userStats: UserStats;
  monthlyMemberCounts: MonthlyMemberCount[];
  monthlyContent: MonthlyContentSummary[];
  channelEff: ChannelEfficiency[];
  contentSummary: ContentSummary;
  realMembers: MemberListEntry[];
};

/**
 * "보고서 미리보기 → PDF 다운로드" 버튼 — 2026-08-15 추가, 같은 날 사용자
 * 피드백으로 미리보기 단계 + 페이지 분할 캡처 방식으로 개선.
 *
 * 흐름: 버튼 클릭 → 모달에 실제 크기 그대로 보고서를 렌더링(미리보기, 아직
 * PDF 아님) → 사용자가 내용을 확인하고 "PDF 다운로드"를 눌러야 그때
 * html2canvas로 캡처해서 저장. 서버 함수 없이 전부 브라우저에서 처리.
 *
 * 페이지 잘림 방지: ReportDocument는 내부적으로 여러 개의 `.pdf-page`
 * 섹션으로 미리 나뉘어 있음(표지+요약 / 세부 분석). 문서 전체를 한 장의
 * 이미지로 찍어서 기계적으로 자르면 표나 카드 중간이 잘리는 문제가
 * 있었는데, 이제 섹션 단위로 각각 캡처해서 PDF 페이지 1장씩 만든다.
 * 혹시라도 한 섹션이 A4 한 장보다 길어지면(채널·국가 데이터가 아주 많을
 * 때) 그 섹션만 추가 페이지로 이어붙여서 — 잘리는 대신 페이지가 늘어난다.
 */
export default function ReportDownloadButton(props: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  async function handleDownload() {
    if (!reportRef.current || status === "generating") return;
    setStatus("generating");

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pageEls = Array.from(reportRef.current.querySelectorAll<HTMLElement>(".pdf-page"));
      if (pageEls.length === 0) throw new Error("no .pdf-page sections found");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      let isFirstPdfPage = true;

      for (const pageEl of pageEls) {
        const canvas = await html2canvas(pageEl, {
          scale: 2, // 텍스트 선명도용 — 한글은 폰트 임베딩 대신 이미지로 캡처되므로 해상도가 중요
          backgroundColor: "#ffffff",
          useCORS: true,
        });

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/png");

        if (imgHeight <= pdfHeight + 0.5) {
          // 한 페이지 안에 다 들어감 — 통째로 한 장에 배치, 잘리지 않음.
          if (!isFirstPdfPage) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
          isFirstPdfPage = false;
        } else {
          // 이 섹션 하나가 A4 한 장보다 김 — 자르지 않고 여러 장으로 이어붙임.
          let heightLeft = imgHeight;
          let position = 0;
          while (heightLeft > 0) {
            if (!isFirstPdfPage) pdf.addPage();
            isFirstPdfPage = false;
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
            position -= pdfHeight;
          }
        }
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`K-UNIV_KPI_Report_${dateStr}.pdf`);
      setStatus("idle");
      setPreviewOpen(false);
    } catch (err) {
      console.error("[ReportDownloadButton] PDF generation failed:", err instanceof Error ? err.message : err);
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
      >
        📄 보고서 미리보기
      </button>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-800">보고서 미리보기</h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-6">
              <div className="mx-auto w-fit shadow-lg">
                <div ref={reportRef}>
                  <ReportDocument {...props} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
              {status === "error" ? (
                <span className="text-xs text-rose-500">생성 실패 — 잠시 후 다시 시도해주세요.</span>
              ) : (
                <span className="text-xs text-slate-400">스크롤해서 전체 내용을 확인하세요</span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={status === "generating"}
                  className="rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "generating" ? "⏳ 생성 중..." : "PDF 다운로드"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
