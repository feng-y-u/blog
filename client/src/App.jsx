import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Loading from './components/Loading'

const HomePage = lazy(() => import('./pages/HomePage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const CategoryListPage = lazy(() => import('./pages/CategoryListPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const TagCloudPage = lazy(() => import('./pages/TagCloudPage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const PostManager = lazy(() => import('./pages/admin/PostManager'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor'))
const CategoryManager = lazy(() => import('./pages/admin/CategoryManager'))
const TagManager = lazy(() => import('./pages/admin/TagManager'))
const CommentManager = lazy(() => import('./pages/admin/CommentManager'))
const NoteManager = lazy(() => import('./pages/admin/NoteManager'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <HelmetProvider>
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
        </Route>
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
          <Route path="posts" element={<SuspenseWrapper><PostManager /></SuspenseWrapper>} />
          <Route path="posts/new" element={<SuspenseWrapper><PostEditor /></SuspenseWrapper>} />
          <Route path="posts/:id/edit" element={<SuspenseWrapper><PostEditor /></SuspenseWrapper>} />
          <Route path="categories" element={<SuspenseWrapper><CategoryManager /></SuspenseWrapper>} />
          <Route path="tags" element={<SuspenseWrapper><TagManager /></SuspenseWrapper>} />
          <Route path="comments" element={<SuspenseWrapper><CommentManager /></SuspenseWrapper>} />
          <Route path="notes" element={<SuspenseWrapper><NoteManager /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
    </HelmetProvider>
  )
}
