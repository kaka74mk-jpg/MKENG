import { Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import AuthGuard from "./components/AuthGuard";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Listen from "./pages/Listen";
import Practice from "./pages/Practice";
import Review from "./pages/Review";
import Profile from "./pages/Profile";
import LessonDetail from "./pages/LessonDetail";
import Coach from "./pages/Coach";
import MasteryDashboard from "./pages/MasteryDashboard";
import Auth from "./pages/Auth";
import Creator from "./pages/Creator";
import StudyLab from "./pages/StudyLab";

function ProtectedApp() {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <main className="flex-1 overflow-y-auto pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:lessonId" element={<LessonDetail />} />
            <Route path="/listen" element={<Listen />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/review" element={<Review />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/mastery" element={<MasteryDashboard />} />
            <Route path="/creator" element={<Creator />} />
            <Route path="/creator/lesson/:lessonId/study" element={<StudyLab />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  );
}
