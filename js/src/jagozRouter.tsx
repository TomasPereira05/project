import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
  SignIn,
  SignUp,
  AuthLayout
} from "./features/auth";
import {
  CreateMembers,
  MemberPage,
  Members,
  UpdateMember,
  MembersLayout,
} from "./features/Members";
import {
  Athletes,
  AthleteByTeamCategory,
  AthletePage,
  AthleteRegister,
  UpdateAthlete,
} from "./features/Athletes";
import {
  SponsorApprovals,
  SponsorCreate,
  MySponsorships,
  SponsorSettings,
  SponsorshipDetails,
  SponsorsInfo,
  SponsorsLayout,
} from "./features/sponsors";
import { AuthProvider } from "./shared/context/AuthContextProvider";
import { AuthRequire, Require } from "./shared/components/Require";
import { Home } from "./features/home";
import { UserPage } from "./features/User";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/profile",
    element: (
      <AuthRequire>
        <UserPage />
      </AuthRequire>
    ),
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { 
        index: true, 
        element: <Navigate to="login" replace /> 
      },
      {
        path: "login",
        element: <SignIn />,
      },
      {
        path: "register",
        element: <SignUp />,
      },
    ]
  },
  {
    path: "/members",
    element:
    <AuthRequire>
      <MembersLayout />
    </AuthRequire>,
    children: [
      { 
        index: true, 
        element: <Navigate to="/" replace /> 
      },
      {
        path: "create",
        element: <CreateMembers />,
      },
      {
        path: ":memberId",
        element: 
        <Require allowAdmin allowMember>
          <MemberPage />
        </Require>,
      },
      {
        path: ":memberId/edit",
        element: 
        <Require allowAdmin allowMember>
          <UpdateMember />
        </Require>,
      },
      {
        path: "list",
        element: 
        <Require allowAdmin>
          <Members />
        </Require>,
      },
    ]
  },
  {
    path: "/athletes",
    element: <Athletes />,
  },
  {
    path: "/athletes/register",
    element: (
      <AuthRequire>
        <AthleteRegister />
      </AuthRequire>
    ),
  },
  {
    path: "/athletes/category/:teamCategory",
    element: <AthleteByTeamCategory />,
  },
  {
    path: "/athletes/:athleteId",
    element: <AthletePage />,
  },
  {
    path: "/athletes/:athleteId/edit",
    element: <UpdateAthlete />,
  },
  {
    path: "/sponsors",
    element: <SponsorsLayout />,
    children: [
      { 
        index: true, 
        element: <Navigate to="/" replace /> 
      },
      {
        path: "info",
        element: <SponsorsInfo />,
      },
      {
        path: "create",
        element: 
        <AuthRequire>
          <SponsorCreate />
        </AuthRequire>,
      },
      {
        path: "my",
        element: (
          <AuthRequire>
            <MySponsorships />
          </AuthRequire>
        ),
      },
      {
        path: "my/:sponsorshipId",
        element: (
          <AuthRequire>
            <SponsorshipDetails />
          </AuthRequire>
        ),
      },
      {
        path: "settings",
        element: (
          <AuthRequire>
            <Require allowAdmin>
              <SponsorSettings />
            </Require>
          </AuthRequire>
        ),
      },
      {
        path: "approvals",
        element: (
          <AuthRequire>
            <Require allowAdmin>
              <SponsorApprovals />
            </Require>
          </AuthRequire>
        ),
      },
    ],
  },
]);

export function jagozRouter() {
  const container = document.getElementById("container");
  if (!container) {
    console.error('Root container with id "container" not found in DOM');
    return;
  }

  createRoot(container).render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
