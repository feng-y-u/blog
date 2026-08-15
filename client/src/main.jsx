import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@automann/maple-mono-cn/regular.css'
import '@automann/maple-mono-cn/medium.css'
import './styles/index.css'
import './styles/theme.css'
import './styles/common.css'
import './styles/article.css'
import './styles/sidebar.css'
import './styles/search.css'
import './styles/writer.css'

// 主题初始化：防止页面闪烁
const savedTheme = localStorage.getItem('blog-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
