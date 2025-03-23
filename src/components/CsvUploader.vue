<template>
  <div class="csv-uploader">
    <div class="upload-container">
      <div
        class="upload-area"
        :class="{ 'is-dragging': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
      >
        <div class="upload-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <div class="upload-text">
          <p>CSVファイルをドラッグ＆ドロップ</p>
          <p>または</p>
        </div>
        <label for="csvInput" class="file-input-label">
          <span>ファイルを選択</span>
          <input
            type="file"
            id="csvInput"
            accept=".csv"
            @change="handleFileUpload"
            class="file-input"
          />
        </label>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-message">ファイルを処理中...</p>
    </div>

    <div v-if="csvData.length > 0 && !isLoading" class="preview-container">
      <h3>CSVプレビュー</h3>
      <div class="csv-preview">
        <table>
          <thead>
            <tr>
              <th v-for="(header, index) in csvHeaders" :key="index">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in csvPreviewData" :key="rowIndex">
              <td v-for="(header, colIndex) in csvHeaders" :key="colIndex">
                {{ row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="action-buttons">
        <button class="submit-button" @click="submitToGitHub" :disabled="isSubmitting">
          {{ isSubmitting ? '送信中...' : 'GitHubに送信' }}
        </button>
        <button class="cancel-button" @click="resetForm">キャンセル</button>
      </div>
    </div>

    <div v-if="submitResult" class="result-container" :class="{ error: submitResult.isError }">
      <p>{{ submitResult.message }}</p>
      <a v-if="submitResult.url" :href="submitResult.url" target="_blank">{{ submitResult.linkText }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Papa from 'papaparse'
import type { CSVRow } from '@/types'

// 状態管理
const isDragging = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const csvData = ref<CSVRow[]>([])
const csvHeaders = ref<string[]>([])
const submitResult = ref<{ message: string; isError: boolean; url?: string; linkText?: string } | null>(null)

// GitHub設定
// 環境変数から取得するか、デフォルト値を使用
const GITHUB_REPO_OWNER = import.meta.env.VITE_GITHUB_REPO_OWNER || 'ユーザー名'
const GITHUB_REPO_NAME = import.meta.env.VITE_GITHUB_REPO_NAME || 'iidx-csv-github-manager'

// CSVプレビューデータ（最初の5行）
const csvPreviewData = computed(() => {
  return csvData.value.slice(0, 5)
})

// ファイルドロップ処理
const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      parseCSV(file)
    } else {
      alert('CSVファイルのみアップロード可能です。')
    }
  }
}

// ファイル選択処理
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    parseCSV(file)
  } else {
    alert('CSVファイルのみアップロード可能です。')
  }
}

// CSVパース処理
const parseCSV = (file: File) => {
  isLoading.value = true
  submitResult.value = null

  Papa.parse(file, {
    header: true,
    complete: (results) => {
      csvData.value = results.data as CSVRow[]
      if (results.data.length > 0 && results.meta.fields) {
        csvHeaders.value = results.meta.fields
      }
      isLoading.value = false
    },
    error: (error: Error) => {
      console.error('CSVパースエラー:', error)
      alert(`CSVパースエラー: ${error.message}`)
      isLoading.value = false
    }
  })
}

// GitHubにデータを送信
const submitToGitHub = async () => {
  if (csvData.value.length === 0) return

  isSubmitting.value = true
  submitResult.value = null

  try {
    // CSVデータをBase64エンコード
    const csvString = Papa.unparse(csvData.value)
    const base64Data = btoa(unescape(encodeURIComponent(csvString)))

    // GitHub Issueを作成
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `CSV Update: ${new Date().toISOString()}`,
        body: `\`\`\`\n${base64Data}\n\`\`\``
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API エラー: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    submitResult.value = {
      message: 'CSVデータが正常に送信されました。GitHub Actionsによる処理が完了するまでお待ちください。',
      isError: false,
      url: data.html_url,
      linkText: 'Issueを確認する'
    }
  } catch (error) {
    console.error('送信エラー:', error)
    submitResult.value = {
      message: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      isError: true
    }
  } finally {
    isSubmitting.value = false
  }
}

// フォームリセット
const resetForm = () => {
  csvData.value = []
  csvHeaders.value = []
  submitResult.value = null
  const input = document.getElementById('csvInput') as HTMLInputElement
  if (input) input.value = ''
}
</script>

<style scoped>
.csv-uploader {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.upload-container {
  width: 100%;
  margin-bottom: 20px;
}

.upload-area {
  width: 100%;
  padding: 30px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #4a6cf7;
  background-color: #f5f7ff;
}

.is-dragging {
  border-color: #4a6cf7;
  background-color: #f0f4ff;
  box-shadow: 0 0 15px rgba(74, 108, 247, 0.2);
}

.upload-icon {
  color: #4a6cf7;
  margin-bottom: 15px;
}

.upload-text {
  text-align: center;
  margin-bottom: 15px;
}

.upload-text p {
  margin: 5px 0;
  color: #666;
}

.file-input-label {
  display: inline-block;
  padding: 12px 24px;
  background: #4a6cf7;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
  box-shadow: 0 4px 6px rgba(74, 108, 247, 0.2);
}

.file-input-label:hover {
  background: #3a5ce5;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(74, 108, 247, 0.25);
}

.file-input {
  display: none;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
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

.preview-container {
  width: 100%;
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.preview-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.csv-preview {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 20px;
}

.csv-preview table {
  width: 100%;
  border-collapse: collapse;
}

.csv-preview th, .csv-preview td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.csv-preview th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.csv-preview tr:hover td {
  background-color: #f9f9f9;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.submit-button, .cancel-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-button {
  background: #4a6cf7;
  color: white;
  border: none;
  box-shadow: 0 4px 6px rgba(74, 108, 247, 0.2);
}

.submit-button:hover:not(:disabled) {
  background: #3a5ce5;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(74, 108, 247, 0.25);
}

.submit-button:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-button {
  background: white;
  color: #666;
  border: 1px solid #ccc;
}

.cancel-button:hover {
  background: #f5f5f5;
  border-color: #999;
}

.result-container {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #e6f7e6;
  border: 1px solid #c3e6cb;
  color: #155724;
  width: 100%;
  text-align: center;
}

.result-container.error {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.result-container a {
  display: inline-block;
  margin-top: 10px;
  color: #4a6cf7;
  text-decoration: none;
  font-weight: 500;
}

.result-container a:hover {
  text-decoration: underline;
}
</style>
