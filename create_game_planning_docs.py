# create_game_planning_docs.py
# Generates Celestial Mythic Fantasy Game Design Documents (Word & Excel)

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# -------------------------------------------------------------
# 1. WORD DOCUMENT GENERATION (.docx)
# -------------------------------------------------------------
def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_styled_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E1B4B") # Celestial Indigo/Purple
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = "Malgun Gothic"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    # Data Rows
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=130, right=130)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx > 0 and len(str(val)) > 15 else WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.name = "Malgun Gothic"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(51, 65, 85)

    if col_widths:
        for row in table.rows:
            for c_idx, w in enumerate(col_widths):
                row.cells[c_idx].width = Inches(w)

    doc.add_paragraph()
    return table

def add_callout(doc, title, text, bg_hex="F5F3FF", border_hex="8B5CF6"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

    p = cell.paragraphs[0]
    r_title = p.add_run(f"✨ {title}\n")
    r_title.font.name = "Malgun Gothic"
    r_title.font.bold = True
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(139, 92, 246)

    r_text = p.add_run(text)
    r_text.font.name = "Malgun Gothic"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph()

def build_word_doc(filepath, concept_img_path=None):
    doc = Document()

    for s in doc.sections:
        s.top_margin = Inches(0.9)
        s.bottom_margin = Inches(0.9)
        s.left_margin = Inches(0.9)
        s.right_margin = Inches(0.9)

    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_title.add_run("CELESTIAL MYTHIC FANTASY GDD\n")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(139, 92, 246)

    r_main = p_title.add_run("Project UpToSpace : 천공의 신화 3D 클라이밍 게임 상세 기획서\n")
    r_main.font.name = "Malgun Gothic"
    r_main.font.size = Pt(20)
    r_main.font.bold = True
    r_main.font.color.rgb = RGBColor(30, 27, 75)

    r_tag = p_title.add_run("천공의 부유 유적과 신화적 룬 스톤을 딛고 1,500m 우주 성문(Star Gate)까지 올라가는 3D 액션 플랫폼")
    r_tag.font.name = "Malgun Gothic"
    r_tag.font.size = Pt(10)
    r_tag.font.italic = True
    r_tag.font.color.rgb = RGBColor(100, 116, 139)

    # Metadata Table
    meta_headers = ["항목", "내용", "비고"]
    meta_data = [
        ["프로젝트명", "Project UpToSpace (Celestial Fantasy)", "3D WebGL / 천공 신화 테마"],
        ["문서 버전", "v1.0 (정식 확정 기획서)", "2026-09-04 확정"],
        ["기획 총괄", "이건우 대표님 (CEO)", "아트 컨셉 및 시스템 최종 승인"],
        ["기획 및 작성", "수석비서 소하 (Executive Assistant)", "프론트오피스 참모"],
        ["아트 비주얼 테마", "천공의 신화적 부유 유적 (Celestial Mythic Ruins)", "대리석, 룬스톤, 파스텔 구름, 황금 성문"],
        ["엔진 / 기술 스택", "HTML5, Vanilla JavaScript, Three.js (WebGL), Web Audio API", "초경량 모바일/PC 즉시 구동"]
    ]
    add_styled_table(doc, meta_headers, meta_data, [1.5, 3.5, 1.5])

    # Section 1
    doc.add_heading("1. 아트 테마 확정 및 핵심 세계관", level=1)
    p = doc.add_paragraph(
        "본 프로젝트의 비주얼 정체성은 대표님의 최종 승인에 따라 '천공의 신화적 부유 유적(Celestial Mythic Ruins)' 테마로 확정되었습니다. "
        "기존 인더스트리얼/공사장 풍의 모방에서 벗어나, 파스텔 톤 구름 바다 위에 부유하는 고대 대리석 신전 잔해, "
        "황금 룬 문자 징검다리, 발광 마법 수정, 그리고 1,500m 우주 심연 정상에 공전하는 황금 성문(Star Gate)을 향해 도약하는 "
        "웅장하고 몽환적인 3D 파쿠르 세계관을 완성합니다."
    )

    if concept_img_path and os.path.exists(concept_img_path):
        p_img_title = doc.add_paragraph("■ 메인 아트 컨셉 시안 : 천공의 신화적 부유 유적 (Celestial Mythic Ruins)")
        p_img_title.runs[0].font.bold = True
        doc.add_picture(concept_img_path, width=Inches(6.2))
        p_cap = doc.add_paragraph("그림 1. 몽환적인 하늘과 부유하는 고대 신전 룬 스톤을 딛고 우주 성문을 향해 도약하는 메인 아트 시안")
        p_cap.runs[0].font.size = Pt(8.5)
        p_cap.runs[0].font.italic = True

    add_callout(doc, "핵심 심리 메커니즘 : 800m 추락의 절망과 신화적 카타르시스", 
                "유저는 몽환적이고 아름다운 천공 유적을 올라갈수록 한 걸음 한 걸음에 극도의 신중함을 기하게 됩니다. "
                "단일 낙하량이 800m 이상 발생할 경우 신화적 징소리와 함께 지상 0m 제단으로 강제 귀환하는 '절망 메커니즘'이 발동하며, "
                "마침내 1,500m 우주 성문에 도달했을 때 압도적인 쾌감과 성취감을 선사합니다.")

    # Section 2
    doc.add_heading("2. 반응형 멀티 플랫폼 컨트롤러 아키텍처", level=1)
    ctrl_headers = ["디바이스", "지원 인터페이스", "이동 조작", "점프 / 달리기", "시점 회전"]
    ctrl_data = [
        ["PC 데스크톱", "키보드 + 마우스", "W, A, S, D 및 방향키", "Spacebar (점프) / L-Shift (달리기)", "마우스 드래그 / Pointer Lock 지원"],
        ["스마트폰", "풀 터치 가상 UI", "좌측 하단 가상 조이스틱", "우측 하단 대형 점프 버튼 / 달리기 토글", "화면 우측 스와이프 시점 360도 회전"],
        ["태블릿", "하이브리드 (키보드+터치)", "외장 키보드 WASD + 가상 조이스틱 병행", "키보드 Space + 온스크린 점프 버튼 동시 활성", "마우스/터치 드래그 동시 수용"]
    ]
    add_styled_table(doc, ctrl_headers, ctrl_data, [1.2, 1.5, 1.4, 1.4, 1.0])

    # Section 3
    doc.add_heading("3. 3D 리깅 캐릭터 및 애니메이션 상태 머신", level=1)
    anim_headers = ["상태 코드", "상태 명칭", "진입 조건", "관절 및 시각적 연출", "사운드 매핑"]
    anim_data = [
        ["IDLE", "대기 자세", "지상 착지 중 이동 입력 없음", "호흡에 맞춘 상하 미세 바운스, 신화적 모션", "-"],
        ["WALK", "보행", "지상 착지 중 저속 이동 (<= 10m/s)", "상체 8도 전진, 팔다리 교차 주기적 스윙", "경쾌한 룬 탭음"],
        ["RUN", "전력질주", "지상 착지 중 Shift 활성 (18m/s)", "상체 16도 공격적 기울임, 보폭 확대", "빠른 룬 탭음"],
        ["JUMP_RISE", "도약 상승", "착지 상태에서 Space 입력 (Vy > 2)", "가슴 펴기, 시선 상향, 양팔 만세 거치", "마법 바람 스윕"],
        ["FALL", "공중 추락 / 패닉", "공중 체공 중 하강 (Vy < 0)", "공중 허우적거림, 시선 지면 제단 고정", "하강 비례 풍절음"],
        ["LAND", "착지 충격 흡수", "공중 상태에서 발판 접지 순간", "골반 침하 및 무릎 완충, 착지 직후 기립", "둔탁한 석재 충격음"]
    ]
    add_styled_table(doc, anim_headers, anim_data, [1.1, 1.2, 1.5, 1.7, 1.0])

    # Section 4
    doc.add_heading("4. 고도별 레벨 디자인 및 스테이지 아키텍처", level=1)
    zone_headers = ["영역 코드", "고도 범위", "테마 및 배경", "주요 발판 구성", "핵심 기믹 및 위험도", "체크포인트"]
    zone_data = [
        ["ZONE 1", "0m ~ 500m", "The Celestial Ascent (천공 입구)", "고대 대리석 기둥, 룬 제단, 마법 석판", "기본 도약 학습, 룬 점프 패드 (난이도 하)", "500m 룬 제단 (CP1)"],
        ["ZONE 2", "501m ~ 1,200m", "Ethereal Sanctuary (천공 신전)", "부유 수정, 빙하 룬스톤, 이동하는 석판", "극저마찰 얼음 룬, 왕복 이동 석판 (난이도 중상)", "1,000m 천공 신전 (CP2)"],
        ["ZONE 3", "1,201m ~ 1,600m+", "Star Gate Void (우주 성문)", "우주 파편, 붕괴 룬, 황금 로드", "1초 후 붕괴되는 소실 룬, 초정밀 파쿠르 (난이도 극상)", "1,500m 황금 성문"]
    ]
    add_styled_table(doc, zone_headers, zone_data, [0.9, 1.2, 1.4, 1.3, 1.5, 1.2])

    # Section 5
    doc.add_heading("5. 800m 절망 낙하 패널티 시스템", level=1)
    p_eq = doc.add_paragraph()
    r_eq = p_eq.add_run("낙하 거리 연산식 : H_drop = Max(0, Y_fall_start - Y_current)\n"
                        "800m 절망 조건 : If (H_drop >= 800m) Then Trigger_Despair_Penalty()")
    r_eq.font.name = "Consolas"
    r_eq.font.size = Pt(9.5)
    r_eq.font.bold = True
    r_eq.font.color.rgb = RGBColor(220, 38, 38)

    add_callout(doc, "800m 절망 패널티 연출 순서",
                "1. [임계치 감지] : 낙하 거리 800m 도달 시점 즉시 신화적 묵직한 징소리 발동\n"
                "2. [시각 경고] : 화면에 퍼플/레드 비네트 펄스와 'FATAL DESPAIR FALL: 800m+ 추락 발생' 오버레이 출력\n"
                "3. [체크포인트 소실] : 기존 획득했던 모든 체크포인트 좌표를 0m(Ground Zero) 제단으로 초기화\n"
                "4. [강제 귀환] : 1.2초 암전 후 지상 0m 제단으로 캐릭터 리스폰")

    doc.save(filepath)
    print(f"Word doc generated successfully: {filepath}")

# -------------------------------------------------------------
# 2. EXCEL DOCUMENT GENERATION (.xlsx)
# -------------------------------------------------------------
def style_excel_sheet(ws, title, headers, data, col_widths=None):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
    title_cell = ws.cell(row=1, column=1, value=title)
    title_cell.font = Font(name="Malgun Gothic", size=14, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 36

    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(headers))
    sub_cell = ws.cell(row=2, column=1, value="Project UpToSpace - Celestial Mythic Fantasy Balance Master Data | v1.0")
    sub_cell.font = Font(name="Malgun Gothic", size=9.5, italic=True, color="A7F3D0")
    sub_cell.fill = PatternFill(start_color="064E3B", end_color="064E3B", fill_type="solid")
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    for c_idx, h_text in enumerate(headers, 1):
        cell = ws.cell(row=3, column=c_idx, value=h_text)
        cell.font = Font(name="Malgun Gothic", size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="7C3AED", end_color="7C3AED", fill_type="solid") # Purple Accent
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    ws.row_dimensions[3].height = 26

    for r_idx, row_values in enumerate(data, 4):
        bg_hex = "F5F3FF" if r_idx % 2 == 1 else "FFFFFF"
        ws.row_dimensions[r_idx].height = 22
        for c_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.font = Font(name="Malgun Gothic", size=9.5, color="334155")
            cell.fill = PatternFill(start_color=bg_hex, end_color=bg_hex, fill_type="solid")
            cell.border = thin_border

            if isinstance(val, (int, float)):
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif len(str(val)) <= 8:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    if col_widths:
        for c_idx, w in enumerate(col_widths, 1):
            ws.column_dimensions[get_column_letter(c_idx)].width = w

    ws.freeze_panes = "A4"

def build_excel_doc(filepath):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    ws1 = wb.create_sheet(title="01_시스템_파라미터")
    h1 = ["파라미터 코드", "파라미터 명칭", "기준값", "단위", "조정 가능 범위", "설명 및 밸런스 영향도"]
    d1 = [
        ["GRAVITY_Y", "중력 가속도", 36.0, "m/s²", "25.0 ~ 50.0", "높을수록 체공시간이 짧아져 날렵한 컨트롤 요구"],
        ["TERMINAL_VEL", "종단 낙하 속도", -55.0, "m/s", "-40.0 ~ -80.0", "최대 추락 속도 상한선"],
        ["WALK_SPEED", "기본 걷기 속도", 10.0, "m/s", "6.0 ~ 14.0", "정밀 발판 조작 시 안정성 확보"],
        ["RUN_SPEED", "전력질주 속도", 18.0, "m/s", "14.0 ~ 24.0", "장거리 점프 도약 시 가속"],
        ["JUMP_FORCE", "기본 점프력", 16.5, "m/s", "12.0 ~ 20.0", "수직 약 3.8m 도약 가능"],
        ["SUPER_JUMP_FORCE", "룬 점프패드 반발력", 38.0, "m/s", "30.0 ~ 50.0", "수직 약 28m 고공 도약 마법 기믹"],
        ["FRICTION_NORMAL", "일반 발판 마찰 계수", 0.82, "ratio", "0.70 ~ 0.95", "기본 접지 감속 계수"],
        ["FRICTION_ICE", "얼음 룬 마찰 계수", 0.03, "ratio", "0.01 ~ 0.08", "극저마찰로 제동 불가능 및 활주 유발"],
        ["DESPAIR_DROP_LIMIT", "절망 추락 판정 거리", 800.0, "m", "500.0 ~ 1200.0", "초과 낙하 시 모든 체크포인트 소실 및 0m 강제 리셋"],
        ["CRUMBLE_DELAY", "소실 룬 붕괴 대기시간", 1.0, "초", "0.6 ~ 2.0", "발판 접지 후 추락까지의 시간"],
        ["CRUMBLE_RESPAWN", "소실 룬 리스폰 주기", 3.2, "초", "2.0 ~ 5.0", "붕괴 후 재출현 대기 시간"],
        ["CULLING_RANGE_Y", "고도 컬링 감지 범위", 25.0, "m", "15.0 ~ 50.0", "충돌 판정 시 상하 검색 고도 폭"],
        ["TOUCH_JOY_RADIUS", "모바일 조이스틱 반경", 55.0, "px", "40.0 ~ 80.0", "모바일 가상 조이스틱 최대 이동 거리"],
        ["CAMERA_DISTANCE", "3인칭 카메라 거리", 6.0, "m", "4.0 ~ 10.0", "캐릭터와 카메라 간 기본 간격"],
        ["CAMERA_SENSITIVITY", "마우스 회전 감도", 0.0024, "factor", "0.001 ~ 0.006", "Pointer Lock 회전 배율"]
    ]
    style_excel_sheet(ws1, "Project UpToSpace : 코어 시스템 파라미터 밸런스 시트 (Celestial Fantasy)", h1, d1, [20, 22, 12, 10, 16, 42])

    ws2 = wb.create_sheet(title="02_고도별_레벨_디자인")
    h2 = ["영역 ID", "구간 명칭", "시작 고도(m)", "종료 고도(m)", "난이도(1~10)", "테마 / 배경 연출", "주요 발판 배치", "특수 기믹", "체크포인트"]
    d2 = [
        ["ZONE_01_A", "천공 플라자 & 룬 제단", 0, 80, 2, "청명한 파스텔 구름 하공", "고대 대리석 제단, 부유석, 계단", "조작 튜토리얼 룬스톤", "지상 0m 제단"],
        ["ZONE_01_B", "대리석 기둥 & 마법 석판", 81, 250, 4, "구름 바다 수평선", "회전 대리석 기둥, 슬림 마법 석판", "1차 룬 점프패드 (85m)", "없음"],
        ["ZONE_01_C", "천공 회랑 & 고공 룬스톤", 251, 500, 6, "노을빛 천공 상공", "지그재그 룬스톤, 대리석 슬라브", "2차 룬 점프패드 (250m)", "500m 룬 제단 (CP1)"],
        ["ZONE_02_A", "천공 빙하 & 부유 수정", 501, 750, 7, "자줏빛 에테르 성층권", "극저마찰 얼음 룬스톤, 부유 수정", "빙판 미끄러짐, 3차 점프대", "없음"],
        ["ZONE_02_B", "에테르 폭풍 & 이동 모놀리스", 751, 1000, 8, "암청색 에테르 폭풍", "X/Z축 좌우 왕복 이동 모놀리스", "동적 왕복 석판, 복합 얼음길", "1,000m 천공 신전 (CP2)"],
        ["ZONE_03_A", "우주 성문 입구 & 소행성", 1001, 1280, 9, "칠흑의 우주 심연, 성운", "붕괴 마법 룬, 소행성 파편", "1초 붕괴 룬, 초정밀 파쿠르", "없음"],
        ["ZONE_03_B", "우주 궤도 회랑", 1281, 1490, 10, "은하수 조망, 무중력 기류", "초고속 왕복 네온 룬, 붕괴 큐브", "붕괴+이동+얼음 3중 복합 트릭", "없음"],
        ["ZONE_03_APEX", "우주 성문 정점 (Star Gate)", 1500, 1600, 1, "찬란한 우주 성문 황금빛", "14m 대형 황금 제단", "공전 황금 성문 포털, 클리어 팡파르", "1,500m 최종 성문"]
    ]
    style_excel_sheet(ws2, "Project UpToSpace : 고도별 레벨 디자인 및 난이도 곡선", h2, d2, [14, 22, 14, 14, 14, 28, 32, 28, 20])

    ws3 = wb.create_sheet(title="03_발판_기믹_데이터베이스")
    h3 = ["기믹 ID", "기믹 명칭", "타입 코드", "기본 크기(W*H*D)", "마찰 계수", "반발 가속도(Vy)", "특수 동작", "사운드 효과", "시각 효과"]
    d3 = [
        ["GIM_MARBLE_BASE", "고대 대리석 석판", "normal", "4.0 x 1.0 x 4.0", 0.82, 0.0, "정적 지형", "석재 착지음", "화이트 대리석 질감"],
        ["GIM_GOLD_RUNE", "황금 룬스톤", "normal", "4.2 x 1.2 x 4.2", 0.82, 0.0, "정적 지형", "마법 착지음", "황금빛 발광 룬 문자"],
        ["GIM_ANCIENT_STONE", "고대 신전 잔해", "normal", "3.5 x 0.8 x 3.5", 0.82, 0.0, "정적 지형", "바위 착지음", "이끼 낀 고대 석재"],
        ["GIM_RUNE_BOUNCE", "룬 도약 점프패드", "jumpPad", "3.0 x 0.4 x 3.0", 0.82, 38.0, "밟는 즉시 고공 마법 사출", "스프링 보잉 사운드", "옐로우 룬 발광 + 탄성 수축"],
        ["GIM_ICE_RUNE", "빙하 마법 룬스톤", "ice", "3.5 x 0.8 x 3.5", 0.03, 0.0, "제동 불가 미끄러짐", "얼음 활주 휘슬음", "반투명 시안 마법 글래스"],
        ["GIM_CRUMBLE_RUNE", "소실 붕괴 룬스톤", "crumble", "2.2 x 0.6 x 2.2", 0.82, 0.0, "1초 진동 후 3.2초 소멸", "마법 균열 삐걱임", "오렌지 네온 진동 깜빡임"],
        ["GIM_MOVE_MONO_X", "X축 이동 모놀리스", "moving", "3.5 x 0.8 x 3.5", 0.82, 0.0, "X축 6m 주기 왕복", "마법 구동 윙 소리", "부유 빛의 궤적"],
        ["GIM_MOVE_MONO_Z", "Z축 이동 모놀리스", "moving", "3.5 x 0.8 x 3.5", 0.82, 0.0, "Z축 6m 주기 왕복", "마법 구동 윙 소리", "부유 빛의 궤적"],
        ["GIM_CHECKPOINT", "천공 세이브 제단", "checkpoint", "10.0 x 1.2 x 10.0", 0.82, 0.0, "리스폰 고도 갱신", "승리 아르페지오", "에메랄드 그린 라이트 빔"],
        ["GIM_STARGATE", "우주 성문 (Star Gate)", "goal", "14.0 x 2.0 x 14.0", 1.00, 0.0, "게임 클리어 트리거", "클리어 팡파르", "황금 회전 포털 토러스"]
    ]
    style_excel_sheet(ws3, "Project UpToSpace : 발판 및 환경 기믹 데이터베이스", h3, d3, [16, 22, 14, 18, 12, 14, 22, 20, 24])

    ws4 = wb.create_sheet(title="04_캐릭터_애니메이션_상태")
    h4 = ["상태 코드", "상태 명칭", "속도 조건", "접지 조건", "루프 여부", "상체 변위(Torso)", "팔 관절(Arms)", "다리 관절(Legs)", "오디오 이펙트"]
    d4 = [
        ["IDLE", "아이들 대기", "V < 0.1 m/s", "Grounded = True", "YES", "상하 호흡 바운스 1.5cm", "자연스러운 하향 거치 (-0.15rad)", "직립 중립 자세", "무음"],
        ["WALK", "일반 보행", "0.1 < V <= 12", "Grounded = True", "YES", "전방 5도 기울임, Y축 진동", "팔 교차 스윙 (±0.7rad)", "다리 교차 보행 (±0.75rad)", "보행 탭 사운드"],
        ["RUN", "전력질주", "V > 12 m/s", "Grounded = True", "YES", "전방 16도 전진 기울임", "큰 폭의 팔 스윙 (±1.2rad)", "넓은 보폭 스트라이드 (±1.15rad)", "빠른 질주 탭"],
        ["JUMP_RISE", "도약 상승", "Vy > 2.0 m/s", "Grounded = False", "NO", "가슴 젖힘, 시선 상향", "양팔 상향 거치 (-2.2rad)", "무릎 굽힘 (1.1rad)", "도약 스윕 사운드"],
        ["FALL", "공중 추락/패닉", "Vy < 0.0 m/s", "Grounded = False", "YES", "상체 불규칙 패닉 진동", "허우적거리는 패닉 모션", "공중에서 버둥거리는 다리", "풍절음 (속도 비례)"],
        ["LAND", "착지 충격 완충", "Vy == 0 (착지)", "Grounded = True", "NO", "골반 20cm 침하, 상체 숙임", "양팔 좌우 균형 유지", "무릎 깊은 굽힘 (1.0rad)", "착지 충격음"]
    ]
    style_excel_sheet(ws4, "Project UpToSpace : 캐릭터 리깅 애니메이션 상태 머신 스펙", h4, d4, [14, 18, 16, 16, 12, 22, 24, 24, 18])

    ws5 = wb.create_sheet(title="05_개발_WBS_및_마일스톤")
    h5 = ["단계", "태스크 ID", "대분류", "세부 작업명", "담당 역할", "선행 작업", "산출물", "완료 기준 (DoD)"]
    d5 = [
        ["Phase 1", "T1-01", "기획", "천공 신화 테마 상세 기획서 (Word GDD) 확정", "수석비서 소하", "-", "Word 문서 (.docx)", "천공 유적 컨셉아트 내장 및 밸런스 완비"],
        ["Phase 1", "T1-02", "기획", "데이터 및 파라미터 밸런스 시트 작성", "수석비서 소하", "T1-01", "Excel 문서 (.xlsx)", "5개 시트 100% 데이터화"],
        ["Phase 2", "T2-01", "엔진 코어", "Three.js 씬, 카메라, 렌더 파이프라인 구축", "게임개발 루카", "-", "main.js, index.html", "WebGL 60 FPS 렌더링 검증"],
        ["Phase 2", "T2-02", "컨트롤러", "PC/모바일/태블릿 반응형 입력 매니저", "프론트 유나", "T2-01", "controls.js", "가상 조이스틱 및 키보드 동시 반응"],
        ["Phase 2", "T2-03", "캐릭터", "3D 리깅 더미 매니킨 및 절차적 애니메이션", "게임개발 루카", "T2-01", "player.js", "6대 상태 머신 모션 블렌딩 완성"],
        ["Phase 3", "T3-01", "물리", "고속 AABB-Capsule 충돌 및 고도 컬링", "CTO 거누", "T2-03", "physics.js", "벽면 밀림 및 접지 판정 정확도 100%"],
        ["Phase 3", "T3-02", "레벨", "0m ~ 1,500m 3대 영역 천공 룬스톤 배치", "게임개발 루카", "T3-01", "world.js", "룬점프대, 빙하룬, 붕괴룬, 이동모놀리스"],
        ["Phase 3", "T3-03", "사운드", "Web Audio API 절차적 사운드 신시사이저", "음악 제이", "-", "audio.js", "점프/착지/바람/신화징소리 0바이트 합성"],
        ["Phase 4", "T4-01", "시스템", "800m 추락 절망 판정 및 리셋 연출", "게임개발 루카", "T3-01", "physics.js, styles.css", "800m 낙하 시 0m 제단 강제 리셋 및 UI 경고"],
        ["Phase 4", "T4-02", "최적화", "모바일 웹 브라우저 프레임 및 발열 테스트", "QA 수호", "T4-01", "테스트 결과 보고서", "모바일 크롬 기준 60 FPS 달성"],
        ["Phase 5", "T5-01", "에셋 확장", "대표님 커스텀 3D 모델(GLB) 로더 인터페이스", "게임개발 루카", "T4-02", "player_loader.js", "외부 GLB 모델 1클릭 교체 지원"]
    ]
    style_excel_sheet(ws5, "Project UpToSpace : 개발 WBS 및 추진 마일스톤 (Celestial Fantasy)", h5, d5, [12, 12, 14, 28, 16, 12, 22, 32])

    wb.save(filepath)
    print(f"Excel doc generated successfully: {filepath}")

if __name__ == "__main__":
    base_dir = r"c:\class"
    word_path = os.path.join(base_dir, "Project_UpToSpace_게임상세기획서_v1.0.docx")
    excel_path = os.path.join(base_dir, "Project_UpToSpace_데이터_및_밸런스시트_v1.0.xlsx")
    concept_img = os.path.join(base_dir, "assets", "new_concept_02_celestial.jpg")

    build_word_doc(word_path, concept_img)
    build_excel_doc(excel_path)
