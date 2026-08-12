import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerified from "./pages/EmailVerified";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/features/admin/components/AdminProtectedRoute";

const Feed = lazy(() => import("./pages/Feed"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Explore = lazy(() => import("./pages/Explore"));
const Communities = lazy(() => import("./pages/Communities"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));

const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const Search = lazy(() => import("./pages/Search"));
const TopicDetail = lazy(() => import("./pages/TopicDetail"));

// Admin
const AdminLayout = lazy(() => import("./features/admin/components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminCommunities = lazy(() => import("./pages/admin/AdminCommunities"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminOpportunities = lazy(() => import("./pages/admin/AdminOpportunities"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminQA = lazy(() => import("./pages/admin/AdminQA"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const PageLoader = () => (
  <div
    className="flex min-h-screen items-center justify-center bg-background"
    role="status"
    aria-label="Loading page"
  >
    <div className="flex flex-col items-center gap-3">
      <img
        src="/cln.png"
        alt=""
        className="h-10 w-10 object-contain animate-pulse-soft"
        aria-hidden="true"
      />
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors duration={5000} visibleToasts={3} closeButton />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/verified" element={<EmailVerified />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
                <Route
                  path="/communities/:id"
                  element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>}
                />
                <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/saved-posts" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/topics/:slug" element={<ProtectedRoute><TopicDetail /></ProtectedRoute>} />

                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />

                {/* Admin Panel */}
                <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="communities" element={<AdminCommunities />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path="opportunities" element={<AdminOpportunities />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="qa" element={<AdminQA />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
