<script setup lang="ts">
import CsvUploader from './components/CsvUploader.vue'
import UpdateHistory from './components/UpdateHistory.vue'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">IIDX CSV GitHub Manager</h1>
      <p class="subtitle">CSVデータをGitHubで管理し、更新履歴を表示します</p>
    </header>

    <main class="main-content">
      <section class="upload-section">
        <h2 class="section-title">CSVアップロード</h2>
        <CsvUploader />
      </section>

      <section class="history-section">
        <UpdateHistory />
      </section>
    </main>

    <footer class="footer">
      <p>© 2025 IIDX CSV GitHub Manager</p>
      <p class="disclaimer">
        本サイトは、株式会社コナミデジタルエンタテインメントとは一切関係の無い個人が製作した非公式ファンサイトです。
      </p>
    </footer>
  </div>
</template>

<style>
:root {
  --primary-color: #4a6cf7;
  --primary-hover: #3a5ce5;
  --text-color: #333;
  --text-light: #666;
  --background: #f5f7fa;
  --card-bg: #ffffff;
  --border-color: #eee;
  --shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.08);
  --radius: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  background-color: var(--background);
  line-height: 1.6;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.title {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(45deg, var(--primary-color), #6a3ef5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-color);
  text-align: center;
}

.upload-section, .history-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer {
  margin-top: 60px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--text-light);
  font-size: 0.9rem;
}

.disclaimer {
  margin-top: 10px;
  font-size: 0.8rem;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .main-content {
    gap: 30px;
  }
}
</style>
