import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import Footer from './components/Footer.tsx'
import LandingPage from './pages/LandingPage.tsx'
import ClaimFlow from './pages/ClaimFlow.tsx'
import Templates from './pages/Templates.tsx'
import ProfileEditor from './pages/ProfileEditor.tsx'
import ProfileView from './pages/ProfileView.tsx'
import TagScan from './pages/TagScan.tsx'
import Admin from './pages/Admin.tsx'
import Login from './pages/Login.tsx'
import MyTags from './pages/MyTags.tsx'
import TagAnalytics from './pages/TagAnalytics.tsx'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-fade">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/claim/:code" element={<ClaimFlow />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/editor/:templateType" element={<ProfileEditor />} />
          <Route path="/editor/:templateType/edit/:publicId" element={<ProfileEditor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-tags" element={<MyTags />} />
          <Route path="/my-tags/:publicId/analytics" element={<TagAnalytics />} />
          <Route path="/p/:publicId" element={<ProfileView />} />
          <Route path="/t/:tagId" element={<TagScan />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
