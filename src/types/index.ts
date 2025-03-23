// CSVデータの型定義
export interface CSVRow {
  [key: string]: string;
}

// GitHub関連の型定義
export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  created_at: string;
  html_url: string;
}

// 更新履歴の型定義
export interface UpdateHistory {
  date: string;
  changes: {
    added: number;
    modified: number;
    removed: number;
  };
  commitUrl: string;
}
