export interface StudentTask {
  label: string;
  target: string;
}

export interface JudgeRule {
  expect: string;
  hintWhenWrong: string;
}

export interface ProblemSchema {
  id: string;
  title: string;
  source: string;
  scenario: string;
  studentTasks: StudentTask[];
  judgeRules: JudgeRule[];
  analysis: string;
  trainingTags: string[];
  difficultyLayer: 1 | 2 | 3;
}
