import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { Navbar } from "./components/Layout/Navbar";
import { Footer } from "./components/Layout/Footer";
import AccessDenied from "./components/AccessDenied";
import { AdminPage, LoginPage, ProfilePage, RegisterPage } from "./page";
import Dashboard from "./page/Profile/Dashboard";
import UserListPage from "./page/Profile/UserListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminOnlyRoute from "./components/AdminOnlyRoute";
import OperatorApplicationsPage from "./features/operator/pages/OperatorApplicationsPage";
import OperatorApplyPage from "./features/operator/pages/OperatorApplyPage";
import RoleListPage from "./features/Role/Components/RoleListPage";
import RoleFormPage from "./features/Role/Components/RoleFormPage";
import UserInterestsPage from "./page/Profile/UserInterestsPage";
import PlaceListPage from "./features/places/Pages/PlaceList";
import PlaceFormPage from "./features/places/Pages/PlaceForm";
import PlaceCategoryList from "./features/placeCategory/Pages/PlaceCategoryList";
import PlaceCategoryFormPage from "./features/placeCategory/Pages/PlaceCategoryForm";
import PlaceTagListPage from "./features/placeTag/Pages/placeTagListPage";
import PlaceTagFormPage from "./features/placeTag/Pages/placeTagFormPage";
import PlaceUserList from "./features/places/Pages/PlaceUserList";
import PlaceUserDetail from "./features/places/Pages/PlaceUserDetail";
import TripListPage from "./features/trip/pages/TripListPage";
import TripCreatePage from "./features/trip/pages/TripCreatePage";
import TripDetailPage from "./features/trip/pages/TripDetailPage";
import TripPlannerPage from "./features/trip/pages/TripPlannerPage";
import TripMapPage from "./features/trip/pages/TripMapPage";
import RecommendAdminPage from "./features/recommend/pages/RecommendAdminPage";
import HomePage from "./features/home/pages/HomePage";
import MyInterestsPage from "./features/interests/pages/MyInterestsPage";
import UserInterestDetailsPage from "./features/interests/pages/UserInterestDetailsPage";
import PlaceOpeningPage from "./features/placeOpening/Pages/PlaceOpeningPage";
import LocalDishList from "./features/localDish/page/LocalDishList";
import LocalDishFormPage from "./features/localDish/page/LocalDishForm";
import LocalDishUserListPage from "./features/localDish/page/LocalDishUserList";
import LocalDishUserDetaill from "./features/localDish/page/LocalDishUserDetaill";
import PlaceMenuManagePage from "./features/places/Pages/PlaceMenuManagePage";
import LocalBusinessListPage from "./features/local-business/page/LocalBusinessList";
import LocalBusinessListUser from "./features/local-business/page/LocalBusinessListUser";
import EventListUser from "./features/events/page/EventListUser";
import PlaceDashboard from "./features/places/Pages/PlaceDashboard";
import { RecommendDebugPage } from "./features/recommend/pages/RecommendDebugPage";

const App: React.FC = () => {
  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  const showFooter = !hideNavbar && location.pathname === "/home";

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accessDenied" element={<AccessDenied />} />
          <Route path="/places" element={<PlaceUserList />} />
          <Route path="/placeDetails/:id" element={<PlaceUserDetail />} />
          <Route path="/localDishs" element={<LocalDishUserListPage />} />
          <Route path="/LocalBusines" element={<LocalBusinessListUser />} />
          <Route path="/events" element={<EventListUser />} />

          <Route
            path="/localDishDetails/:dishId"
            element={<LocalDishUserDetaill />}
          />
          <Route path="/home" element={<HomePage />} />
          <Route path="/me/interests" element={<MyInterestsPage />} />

          {/* User (ต้อง login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/interests" element={<UserInterestsPage />} />
            <Route path="/operator/apply" element={<OperatorApplyPage />} />
          </Route>
          <Route path="/trip" element={<TripListPage />} />
          <Route path="/trip/create" element={<TripCreatePage />} />
          <Route path="/trip/:id" element={<TripDetailPage />} />
          <Route path="/trip/:id/planner" element={<TripPlannerPage />} />
          <Route path="/trip/:id/map" element={<TripMapPage />} />

          {/* Admin (ต้อง login + ต้องเป็น admin) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />}>
              {/* ผู้ประกอบการ + แอดมิน */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="place" element={<PlaceListPage />} />
              <Route path="place/add" element={<PlaceFormPage />} />
              <Route path="place/edit/:id" element={<PlaceFormPage />} />
              <Route path="place/dashboard/:placeId" element={<PlaceDashboard />} />
              <Route path="places/:placeId/opening" element={<PlaceOpeningPage />} />
              <Route path="places/:placeId/menus" element={<PlaceMenuManagePage />} />
              <Route path="localDish" element={<LocalDishList />} />
              <Route path="localDish/add" element={<LocalDishFormPage />} />
              <Route path="localDish/edit/:id" element={<LocalDishFormPage />} />

              {/* เฉพาะแอดมิน */}
              <Route element={<AdminOnlyRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile/:userid" element={<ProfilePage />} />
                <Route path="userList" element={<UserListPage />} />
                <Route path="recommendDebug/:userid" element={<RecommendDebugPage />} />
                <Route path="operators" element={<OperatorApplicationsPage />} />

                <Route path="role" element={<RoleListPage />} />
                <Route path="role/add" element={<RoleFormPage />} />
                <Route path="role/edit/:id" element={<RoleFormPage />} />

                <Route path="placeCategory" element={<PlaceCategoryList />} />
                <Route path="placeCategory/add" element={<PlaceCategoryFormPage />} />
                <Route path="placeCategory/edit/:categoryId" element={<PlaceCategoryFormPage />} />

                <Route path="placeTag" element={<PlaceTagListPage />} />
                <Route path="placeTag/add" element={<PlaceTagFormPage />} />
                <Route path="placeTag/edit/:tagId" element={<PlaceTagFormPage />} />

                <Route path="recommend" element={<RecommendAdminPage />} />
                <Route path="users/:userId/interests" element={<UserInterestDetailsPage />} />
                <Route path="localBusiness" element={<LocalBusinessListPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </div>

      {showFooter && <Footer />}
    </div>
  );
};

export default App;
