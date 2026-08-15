import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import Loading from './components/Loading'
import { SettingsProvider } from './contexts/SettingsContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const CategoryListPage = lazy(() => import('./pages/CategoryListPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const TagCloudPage = lazy(() => import('./pages/TagCloudPage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const WriterPage = lazy(() => import('./pages/WriterPage'))

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <HelmetProvider>
      <SettingsProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SuspenseWrapper><HomePage /></SuspenseWrapper>} />
          <Route path="/post/:slug" element={<SuspenseWrapper><PostDetailPage /></SuspenseWrapper>} />
          <Route path="/categories" element={<SuspenseWrapper><CategoryListPage /></SuspenseWrapper>} />
          <Route path="/category/:slug" element={<SuspenseWrapper><CategoryPage /></SuspenseWrapper>} />
          <Route path="/tags" element={<SuspenseWrapper><TagCloudPage /></SuspenseWrapper>} />
          <Route path="/tag/:slug" element={<SuspenseWrapper><TagPage /></SuspenseWrapper>} />
          <Route path="/search" element={<SuspenseWrapper><SearchPage /></SuspenseWrapper>} />
          <Route path="/notes" element={<SuspenseWrapper><NotesPage /></SuspenseWrapper>} />
          <Route path="/writer" element={<SuspenseWrapper><WriterPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
      </SettingsProvider>
    </HelmetProvider>
  )
}
