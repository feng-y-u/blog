import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import CategoryListPage from './pages/CategoryListPage'
import CategoryPage from './pages/CategoryPage'
import TagCloudPage from './pages/TagCloudPage'
import TagPage from './pages/TagPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import PostManager from './pages/admin/PostManager'
import PostEditor from './pages/admin/PostEditor'
import CategoryManager from './pages/admin/CategoryManager'
import TagManager from './pages/admin/TagManager'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:slug" element={<PostDetailPage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/tags" element={<TagCloudPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="posts" element={<PostManager />} />
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/:id/edit" element={<PostEditor />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="tags" element={<TagManager />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
