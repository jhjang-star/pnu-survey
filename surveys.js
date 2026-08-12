/* =====================================================================
 * surveys.js — 부산대 AI 수학 학습 설문 문항 스키마
 * 실제 구글폼(사전/사후)에서 추출한 문항을 그대로 반영.
 *
 * 문항 type:
 *   'section'  : 섹션 구분(질문 아님)
 *   'scale'    : 5점 리커트 척도 (scaleLabels = [왼쪽라벨, 오른쪽라벨])
 *   'radio'    : 단일 선택
 *   'checkbox' : 복수 선택
 *   'short'    : 단답형
 *   'long'     : 장문형
 *   other:true : "기타" 직접입력 옵션 포함
 * ===================================================================== */

window.SURVEYS = {
  pre: {
    key: 'pre',
    title: 'AI 기반 수학 학습 지원 시스템 활용 수업 사전 설문조사',
    subtitle: '수업 시작 전, 여러분의 수학 학습 배경과 기대를 확인하기 위한 설문입니다. (약 5분)',
    sheet: '사전설문',
    questions: [
      { id: 'q1', type: 'radio', required: true,
        label: '현재 수강 중인 학기는 언제입니까?',
        options: ['2026년 여름계절학기', '2026년 2학기'] },
      { id: 'q2', type: 'radio', required: true, other: true,
        label: '현재 수강 중인 과목은 무엇입니까?',
        options: ['수학1', '수학2', '공학미적분학1', '공학미적분학2', '공학미적분학', '공업수학', '(공학)선형대수학'] },
      { id: 'q3', type: 'radio', required: true,
        label: '성별',
        options: ['남성', '여성', '응답하지 않음'] },
      { id: 'q4', type: 'radio', required: true,
        label: '현재 학년',
        options: ['1학년', '2학년', '3학년', '4학년 이상'] },
      { id: 'q5', type: 'short', required: true,
        label: '소속 학과를 입력해 주세요.',
        placeholder: '예) 기계공학부' },
      { id: 'q6', type: 'radio', required: true,
        label: '학생 유형',
        options: ['신입학', '편입학'] },

      { type: 'section', label: '수학 학습 배경' },
      { id: 'q7', type: 'checkbox', required: true,
        label: '고등학교에서 이수한 수학 과목은 무엇입니까? (복수 선택 가능)',
        options: ['수학Ⅰ', '수학Ⅱ', '미적분', '확률과 통계', '기하', '기억나지 않음'] },
      { id: 'q8', type: 'checkbox', required: true, other: true,
        label: '대학 입학 후 수강한 수학 교과목은 무엇입니까? (복수 선택 가능)',
        options: ['없음', '브릿지기초수학', '기초수학', '수학1(공학미적분학1)', '수학2(공학미적분학2)', '공학미적분학', '(공학)선형대수학', '공업수학'] },
      { id: 'q9', type: 'scale', required: true,
        label: '현재 자신의 수학 실력은 어느 정도라고 생각합니까?',
        scaleLabels: ['매우 부족', '매우 우수'] },

      { type: 'section', label: '수학 학습 태도' },
      { id: 'q10', type: 'scale', required: true, label: '수학에 흥미가 있다.' },
      { id: 'q11', type: 'scale', required: true, label: '나는 수학 문제를 스스로 해결하려고 노력한다.' },
      { id: 'q12', type: 'scale', required: true, label: '나는 자신의 학습 상태를 점검하며 공부하는 편이다.' },

      { type: 'section', label: 'AI 기반 학습 기대' },
      { id: 'q13', type: 'scale', required: true,
        label: '수학 학습에서 AI 기반 학습 시스템을 사용해 본 경험이 있다.',
        scaleLabels: ['전혀 없다', '매우 많다'] },
      { id: 'q14', type: 'scale', required: true, label: 'AI 기반 학습 시스템이 학습에 도움이 될 것이라고 생각한다.' },
      { id: 'q15', type: 'scale', required: true, label: 'AI가 제공하는 맞춤형 피드백은 학습 효과를 높일 것이라고 생각한다.' },
      { id: 'q16', type: 'scale', required: true, label: '이번 수업에서 AI 기반 학습 활동에 적극 참여할 의향이 있다.' },
    ],
  },

  post: {
    key: 'post',
    title: 'AI 기반 수학 학습 지원 시스템 활용 수업 사후 설문조사',
    subtitle: '수업 이후, AI 기반 학습 경험에 대한 여러분의 의견을 듣기 위한 설문입니다. (약 5~7분)',
    sheet: '사후설문',
    questions: [
      { type: 'section', label: '수학 학습 태도' },
      { id: 'q1', type: 'scale', required: true, label: '수학 학습에 대한 흥미가 있다.' },
      { id: 'q2', type: 'scale', required: true, label: '나는 수학 문제를 스스로 해결하려고 노력한다.' },
      { id: 'q3', type: 'scale', required: true, label: '나는 자신의 학습 상태를 점검하며 공부하는 편이다.' },

      { type: 'section', label: 'AI 기반 학습 경험 평가' },
      { id: 'q4', type: 'scale', required: true, label: 'AI 기반 학습 과제가 실제 학습에 도움이 되었다.' },
      { id: 'q5', type: 'scale', required: true, label: 'AI가 제공한 피드백은 오답을 이해하는 데 도움이 되었다.' },
      { id: 'q6', type: 'scale', required: true, label: 'AI 기반 학습 활동이 학습 동기를 높이는 데 도움이 되었다.' },
      { id: 'q7', type: 'scale', required: true, label: 'AI 기반 학습 활동이 자기주도 학습에 도움이 되었다.' },
      { id: 'q8', type: 'scale', required: true, label: '향후 다른 수학 과목에서도 AI 기반 학습 활동을 활용하고 싶다.' },
      { id: 'q9', type: 'scale', required: true, label: 'AI 기반 학습 활동 전반에 만족한다.' },
      { id: 'q10', type: 'scale', required: true, label: '이번 AI 기반 학습 활동은 본인의 수학 학습에 긍정적인 변화를 가져왔다.' },

      { type: 'section', label: '시스템 기능 평가' },
      { id: 'q11', type: 'scale', required: true, label: '시스템 사용 방법이 이해하기 쉬웠다.' },
      { id: 'q12', type: 'scale', required: true, label: '원하는 기능을 쉽게 찾을 수 있었다.' },
      { id: 'q13', type: 'scale', required: true, label: '시스템 반응 속도에 만족한다.' },
      { id: 'q14', type: 'scale', required: true, label: '학습 진행 상황을 확인하기 편리하였다.' },
      { id: 'q15', type: 'scale', required: true, label: '전반적인 사용자 환경(UI/UX)에 만족한다.' },

      { type: 'section', label: '기능 활용 평가' },
      { id: 'q16', type: 'checkbox', required: true, other: true,
        label: '가장 도움이 되었던 기능은 무엇입니까?',
        options: ['취약 단원 진단', '개인 맞춤형 문제 추천', '오답 피드백 제공', '유사 문제 자동 생성', '단계별 풀이 제공', '학습 진도 확인'] },
      { id: 'q17', type: 'radio', required: true,
        label: 'AI 기반 학습 시스템 사용 중 어려움을 경험한 적이 있습니까?',
        options: ['없음', '가끔 있음', '자주 있음'] },
      { id: 'q18', type: 'long', required: false,
        label: '어려움을 경험했다면 어떤 내용이었습니까?',
        placeholder: '자유롭게 작성해 주세요. (선택)' },

      { type: 'section', label: '향후 개선 방향' },
      { id: 'q19', type: 'long', required: false,
        label: '앞으로 추가되었으면 하는 기능은 무엇입니까?',
        placeholder: '자유롭게 작성해 주세요. (선택)' },
      { id: 'q20', type: 'long', required: false,
        label: 'AI 기반 수학 학습 시스템 개선을 위해 필요한 점을 자유롭게 작성해 주세요.',
        placeholder: '자유롭게 작성해 주세요. (선택)' },
    ],
  },
};

/* 리커트 5점 기본 라벨 (좌 1점 ~ 우 5점) */
window.SCALE_DEFAULT = ['매우 그렇지 않다', '매우 그렇다'];
window.SCALE_POINTS = ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'];
