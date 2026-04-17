import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Home from "./features/home/Home";
import SignIn from "./features/auth/components/signIn";
import { 
  CreateMembers, 
  MemberPage, 
  Members, 
  UpdateMember 
} from "./features/Members";

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

  createRoot(container).render(<RouterProvider router={router} />);
}
