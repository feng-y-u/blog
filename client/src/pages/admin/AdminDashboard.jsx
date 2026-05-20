export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold" id="postCount">-</div>
          <div className="text-sm text-gray-500">文章总数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold" id="categoryCount">-</div>
          <div className="text-sm text-gray-500">分类数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold" id="tagCount">-</div>
          <div className="text-sm text-gray-500">标签数</div>
        </div>
      </div>
    </div>
  )
}
