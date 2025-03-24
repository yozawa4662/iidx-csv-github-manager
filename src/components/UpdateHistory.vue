<template>
  <div class="update-history">
    <h2 class="title">更新履歴</h2>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-message">履歴を読み込み中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchHistory" class="retry-button">再試行</button>
    </div>

    <div v-else-if="history.length === 0" class="empty-container">
      <p>更新履歴がありません。</p>
    </div>

    <div v-else class="history-list">
      <div v-for="(item, index) in history" :key="index" class="history-item">
        <div class="history-header">
          <div class="history-date">{{ formatDate(item.date) }}</div>
          <a :href="item.commitUrl" target="_blank" class="history-link">GitHubで確認</a>
        </div>
        <div class="history-changes">
          <div class="change-item added" v-if="item.changes.added > 0">
            <span class="change-icon">+</span>
            <span class="change-text">{{ item.changes.added }}行追加</span>
          </div>
          <div class="change-item modified" v-if="item.changes.modified > 0">
            <span class="change-icon">~</span>
            <span class="change-text">{{ item.changes.modified }}行変更</span>
          </div>
          <div class="change-item removed" v-if="item.changes.removed > 0">
            <span class="change-icon">-</span>
            <span class="change-text">{{ item.changes.removed }}行削除</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UpdateHistory } from '../types'

// GitHub設定
// 環境変数から取得するか、デフォルト値を使用
const GITHUB_REPO_OWNER = import.meta.env.VITE_GITHUB_REPO_OWNER || 'ユーザー名'
const GITHUB_REPO_NAME = import.meta.env.VITE_GITHUB_REPO_NAME || 'iidx-csv-github-manager'

// 状態管理
const history = ref<UpdateHistory[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 履歴データの取得
const fetchHistory = async () => {
  isLoading.value = true
  error.value = null

  try {
    // GitHubのコミット履歴を取得
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?path=data.csv`)

    if (!response.ok) {
      throw new Error(`GitHub API エラー: ${response.status} ${response.statusText}`)
    }

    const commits = await response.json()

    // コミット履歴から更新履歴を生成
    const historyData: UpdateHistory[] = []

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i]

      // 差分情報を取得（最初のコミットの場合は前のコミットがないのでスキップ）
      if (i < commits.length - 1) {
        const diffResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/compare/${commits[i + 1].sha}...${commit.sha}`
        )

        if (!diffResponse.ok) continue

        const diffData = await diffResponse.json()

        // 変更行数をカウント
        let added = 0
        let modified = 0
        let removed = 0

        for (const file of diffData.files) {
          if (file.filename === 'data.csv') {
            added += file.additions
            removed += file.deletions
            modified += file.changes - (file.additions + file.deletions)
          }
        }

        historyData.push({
          date: commit.commit.author.date,
          changes: {
            added,
            modified,
            removed
          },
          commitUrl: commit.html_url
        })
      }
    }

    history.value = historyData
  } catch (err) {
    console.error('履歴取得エラー:', err)
    error.value = `履歴の取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    isLoading.value = false
  }
}

// 日付のフォーマット
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// コンポーネントのマウント時に履歴を取得
onMounted(fetchHistory)
</script>

<style scoped>
.update-history {
  width: 100%;
  max-width: 800px;
  margin: 20px 0;
}

.title {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40px 0;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(74, 108, 247, 0.3);
  border-radius: 50%;
  border-top-color: #4a6cf7;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}

.retry-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #c82333;
}

.empty-container {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-date {
  font-weight: 500;
  color: #333;
}

.history-link {
  color: #4a6cf7;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.history-link:hover {
  color: #3a5ce5;
  text-decoration: underline;
}

.history-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.change-item {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.change-icon {
  font-weight: bold;
  margin-right: 5px;
}

.added {
  background-color: #e6f7e6;
  color: #155724;
}

.modified {
  background-color: #fff3cd;
  color: #856404;
}

.removed {
  background-color: #f8d7da;
  color: #721c24;
}
</style>
