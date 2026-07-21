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
  AthletesLayout,
  AthleteByTeamCategory,
  AthleteFees,
  AthletePage,
  CreateAthlete,
  TeamSettings,
  UpdateAthlete,
} from "./features/Athletes";
import {
  ListSponsorships,
  SponsorApprovals,
  SponsorCreate,
  MySponsorships,
  SponsorsList,
  SponsorSettings,
  SponsorshipDetails,
  SponsorsInfo,
  SponsorsLayout,
} from "./features/sponsors";
import { AuthProvider } from "./shared/context/AuthContextProvider";
import { AuthRequire, Require } from "./shared/components/Require";
import NotFound from "./shared/components/NotFound";
import { Home } from "./features/Home";
import { UserDetails, UserPage, UsersLayout, UsersList } from "./features/User";
import { PaymentCancel, PaymentSuccess } from "./features/payments";
import { AdminHome, AdminLayout, AuditLogs, SeasonSettings, TrainingSchedules } from "./features/admin";
import { EventsList, EventForm, EventTickets, TicketScanner, EventsPublicList, TicketCheckout } from "./features/events";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/profile",
    element: (
      <AuthRequire>
        <UsersLayout />
      </AuthRequire>
    ),
    children: [
      {
        index: true,
        element: <UserPage />,
      },
    ],
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
        <Require allowAdmin allowSecretaria allowMember>
          <MemberPage />
        </Require>,
      },
      {
        path: ":memberId/edit",
        element:
        <Require allowAdmin allowSecretaria allowMember>
          <UpdateMember />
        </Require>,
      },
    ]
  },
  {
    path: "/athletes",
    element: <AthletesLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/" replace />,
      },
      {
        path: "register",
        element: (
          <AuthRequire>
            <CreateAthlete />
          </AuthRequire>
        ),
      },
      {
        path: "category/:teamCategory",
        element: <AthleteByTeamCategory />,
      },
      {
        path: ":athleteId/fees",
        element: (
          <AuthRequire>
            <AthleteFees />
          </AuthRequire>
        ),
      },
      {
        path: ":athleteId",
        element: <AthletePage />,
      },
    ],
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
    ],
  },
  {
    path: "/admin",
    element: (
      <AuthRequire>
        <Require allowAdmin allowSecretaria>
          <AdminLayout />
        </Require>
      </AuthRequire>
    ),
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      {
        path: "members",
        element: <Members />,
      },
      {
        path: "users",
        element: <UsersList />,
      },
      {
        path: "users/:userId",
        element: <UserDetails />,
      },
      {
        path: "members/create",
        element: <CreateMembers />,
      },
      {
        path: "members/:memberId",
        element: <MemberPage />,
      },
      {
        path: "members/:memberId/edit",
        element: <UpdateMember />,
      },
      {
        path: "athletes",
        element: <Athletes />,
      },
      {
        path: "athletes/register",
        element: <CreateAthlete />,
      },
      {
        path: "athletes/:athleteId",
        element: <AthletePage />,
      },
      {
        path: "athletes/:athleteId/edit",
        element: <UpdateAthlete />,
      },
      {
        path: "team-settings",
        element: <TeamSettings />,
      },
      {
        path: "sponsors",
        element: <ListSponsorships />,
      },
      {
        path: "sponsors/companies",
        element: <SponsorsList />,
      },
      {
        path: "sponsors/approvals",
        element: <SponsorApprovals />,
      },
      {
        path: "sponsors/settings",
        element: <SponsorSettings />,
      },
      {
        path: "sponsors/create",
        element: <SponsorCreate />,
      },
      {
        path: "sponsors/details/:sponsorshipId",
        element: <SponsorshipDetails />,
      },
      {
        path: "events",
        element: <EventsList />,
      },
      {
        path: "training-schedules",
        element: <TrainingSchedules />,
      },
      {
        path: "seasons",
        element: <SeasonSettings />,
      },
      {
        path: "audit-logs",
        element: <AuditLogs />,
      },
      {
        path: "events/new",
        element: <EventForm />,
      },
      {
        path: "events/:eventId/edit",
        element: <EventForm />,
      },
      {
        path: "events/:eventId/tickets",
        element: <EventTickets />,
      },
      {
        path: "events/:eventId/scan",
        element: <TicketScanner />,
      },
    ],
  },
  {
    path: "/tickets",
    element: <EventsPublicList />,
  },
  {
    path: "/tickets/:eventId",
    element: <TicketCheckout />,
  },
  {
    path: "/payments/success",
    element: <PaymentSuccess />,
  },
  {
    path: "/payments/cancel",
    element: <PaymentCancel />,
  },
  {
    path: "*",
    element: <NotFound />,
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
