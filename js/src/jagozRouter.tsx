import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { SignIn, SignUp } from "./features/auth";
import { 
  CreateMembers, 
  MemberPage, 
  Members, 
  UpdateMember 
} from "./features/Members";
import { AuthProvider } from "./shared/components/AuthRequire";
import { Home } from "./features/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <SignIn />
  },
  {
    path: "/register",
    element: <SignUp />
  },
  {
    path: "/members",
    element: <Members />,
  },
  {
    path: "/members/create",
    element: <CreateMembers />,
  },
  {
    path: "/members/:memberId",
    element: <MemberPage />,
  },
  {
    path: "/members/:memberId/edit",
    element: <UpdateMember />,
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
