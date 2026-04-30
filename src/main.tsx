import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';

// 懶加載各頁面，進入該頁時才載入（避免一開始就下載所有音源）
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const TonnetzPage = lazy(() => import('./pages/TonnetzPage.tsx'));
const Identify = lazy(() => import('./pages/Identify.tsx'));
const Knowledge = lazy(() => import('./pages/KnowledgePage.tsx'));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage.tsx'));
const ChapterContentPage = lazy(() => import('./pages/ChapterContentPage.tsx'));
const Profile = lazy(() => import('./pages/Profile.tsx'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("缺少 Google Client ID，請檢查 .env 檔案");
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'home', element: <Suspense fallback={null}><HomePage /></Suspense> },
      { path: 'about', element: <Suspense fallback={null}><AboutPage /></Suspense> },
      { path: 'login', element: <Suspense fallback={null}><LoginPage /></Suspense> },
      { path: 'identify', element: <Suspense fallback={null}><Identify /></Suspense> },
      { path: 'knowledge', element: <Suspense fallback={null}><Knowledge /></Suspense> },
      { path: 'knowledge/:topicId', element: <Suspense fallback={null}><TopicDetailPage /></Suspense> },
      { path: 'knowledge/:topicId/:chapterId', element: <Suspense fallback={null}><ChapterContentPage /></Suspense> },
      { path: 'tonnetz', element: <Suspense fallback={null}><TonnetzPage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={null}><Profile /></Suspense> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
